<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Models\WebsiteContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WebsiteContentController extends Controller
{
    // GET /admin/website-content — all content grouped by section
    public function index(): JsonResponse
    {
        $rows    = WebsiteContent::all();
        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->section][$row->key] = [
                'id'        => $row->id,
                'value'     => $row->value,
                'image_url' => $row->image_url,
            ];
        }
        return response()->json(['data' => $grouped]);
    }

    // POST /admin/website-content — upsert one field
    public function upsert(Request $request): JsonResponse
    {
        $request->validate([
            'section' => 'required|string|max:100',
            'key'     => 'required|string|max:100',
            'value'   => 'nullable|string',
            'image'   => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if (!$value || !($value instanceof \Illuminate\Http\UploadedFile)) return;
                    $mime    = $value->getMimeType() ?? '';
                    $isVideo = str_starts_with($mime, 'video/');
                    $isImage = in_array($mime, ['image/jpeg','image/png','image/gif','image/svg+xml','image/webp']);
                    if (!$isVideo && !$isImage) {
                        $fail('The file must be an image (jpeg, png, gif, svg, webp) or video (mp4, webm, mov).');
                        return;
                    }
                    $maxBytes = $isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024; // 200MB video / 10MB image
                    if ($value->getSize() > $maxBytes) {
                        $fail('The file may not be larger than ' . ($isVideo ? '200MB' : '10MB') . '.');
                    }
                },
            ],
        ]);

        $row = WebsiteContent::firstOrNew([
            'section' => $request->section,
            'key'     => $request->key,
        ]);

        if ($request->filled('value')) {
            $row->value = $request->value;
        }

        if ($request->hasFile('image')) {
            if ($row->image_path) {
                Storage::disk('public')->delete($row->image_path);
            }
            $file     = $request->file('image');
            $isVideo  = str_starts_with($file->getMimeType(), 'video/');
            $folder   = $isVideo ? "website/{$request->section}/videos" : "website/{$request->section}";
            $row->image_path = $file->store($folder, 'public');
        }

        $row->save();

        return response()->json(['data' => $row]);
    }

    // DELETE /admin/website-content/{websiteContent}/image
    public function deleteImage(WebsiteContent $websiteContent): JsonResponse
    {
        if ($websiteContent->image_path) {
            Storage::disk('public')->delete($websiteContent->image_path);
            $websiteContent->update(['image_path' => null]);
        }
        return response()->json(['data' => $websiteContent]);
    }
}
