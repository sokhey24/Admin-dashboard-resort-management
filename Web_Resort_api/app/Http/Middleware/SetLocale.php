<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $lang = $request->header('Accept-Language');

        if ($lang) {
            $primary = strtolower(trim(explode(',', explode(';', $lang)[0])[0]));
            if (str_starts_with($primary, 'km') || $primary === 'kh') {
                app()->setLocale('km');
            } else {
                app()->setLocale('en');
            }
        } else {
            app()->setLocale('en');
        }

        return $next($request);
    }
}
