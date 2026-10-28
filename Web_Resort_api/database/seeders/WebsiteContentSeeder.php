<?php

namespace Database\Seeders;

use App\Models\WebsiteContent;
use Illuminate\Database\Seeder;

/**
 * Default Solara guest-website CMS rows (headless marketing content).
 * Idempotent: upserts by (section, key) without deleting custom admin edits on re-run
 * unless keys match exactly.
 */
class WebsiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedHero();
        $this->seedTrustBar();
        $this->seedPromo();
        $this->seedActivities();
        $this->seedServices();
        $this->seedDining();
        $this->seedAbout();
        $this->seedContact();
        $this->seedFooter();
    }

    private function upsertScalar(string $section, string $key, string $value): void
    {
        WebsiteContent::updateOrCreate(
            ['section' => $section, 'key' => $key],
            ['value' => $value]
        );
    }

    private function upsertJson(string $section, string $key, array $data): void
    {
        $this->upsertScalar(
            $section,
            $key,
            json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
    }

    private function seedHero(): void
    {
        $rows = [
            'badge'       => 'Sanctuary of Mindful Luxury',
            'badge_km'    => 'ទីជម្រកនៃប្រណម្ភភាពដ៏មានគំនិត',
            'title'       => 'Find Your Sanctuary in Southeast Asia',
            'title_km'    => 'ស្វែងរកទីជម្រករបស់អ្នកនៅអាស៊ីអាគ្នេយ៍',
            'subtitle'    => 'Immerse yourself in world-class coastal villas, ancient forest pavilions, and tailored hospitality across Cambodia\'s most pristine horizons.',
            'subtitle_km' => 'លោតចូលទៅក្នុងវីឡាឆ្នេរសមុទ្រជាមួយពិភពលោក សំណងព្រៃបុរាណ និងប្រណីតភាពផ្ទាល់ខ្លួននៅទីដូចដែលមិនទាន់ប៉ះពាល់នៅកម្ពុជា។',
        ];

        foreach ($rows as $key => $value) {
            $this->upsertScalar('hero', $key, $value);
        }
    }

    private function seedTrustBar(): void
    {
        $this->upsertJson('trust_bar', 'items', [
            [
                'id'            => 'trust-award',
                'icon'          => 'Award',
                'title'         => 'Award-Winning Hospitality',
                'title_km'      => 'ប្រណីតភាពឈ្នះពានរង្វាន់',
                'description'   => 'Recognized by World Luxury Hotel Awards for excellence across our Cambodian sanctuaries.',
                'description_km'=> 'ទទួលបានការទទួលស្គាល់ពី World Luxury Hotel Awards សម្រាប់គុណភាពនៅទីជម្រកកម្ពុជារបស់យើង។',
            ],
            [
                'id'            => 'trust-safe',
                'icon'          => 'Shield',
                'title'         => 'Safe & Private',
                'title_km'      => 'សុវត្ថិភាព និងឯកជនភាព',
                'description'   => 'Gated villas, discreet arrivals, and 24-hour security across every Solara property.',
                'description_km'=> 'វីឡាមានការពារ ការមកដល់យ៉ាងសម្ងាត់ និងសន្តិសុខ ២៤ម៉ោងនៅរាល់ទីតាំង។',
            ],
            [
                'id'            => 'trust-butler',
                'icon'          => 'Clock',
                'title'         => '24/7 Dedicated Butler',
                'title_km'      => 'ប៊យធឺរ ២៤/៧ ផ្ទាល់ខ្លួន',
                'description'   => 'Personal concierge guild for dining, wellness, transfers, and bespoke celebrations.',
                'description_km'=> 'ក្រុមជំនួយការផ្ទាល់ខ្លួនសម្រាប់ម្ហូប សុខភាព ការដឹកជញ្ជូន និងពិធីពិសេស។',
            ],
            [
                'id'            => 'trust-ocean',
                'icon'          => 'Waves',
                'title'         => 'Oceanfront Sanctuary',
                'title_km'      => 'ទីជម្រកមាត់សមុទ្រ',
                'description'   => 'Private beaches, infinity pools, and fleet transfers to Cambodia\'s hidden islands.',
                'description_km'=> 'ឆ្នេរឯកជន អាងហែលទឹកគ្មានទីបញ្ចប់ និងការដឹកជញ្ជូនទៅកោះលាក់កំបាំងនៅកម្ពុជា។',
            ],
        ]);
    }

    private function seedPromo(): void
    {
        $rows = [
            'tag'           => 'Seasonal Resident Privileges',
            'tag_km'        => 'សិទ្ធិពិសេសប្រចាំរដូវកាល',
            'title'         => 'Stay Four Nights, Savor the Fourth with Our Compliments',
            'title_km'      => 'ស្នាក់នៅ ៤យប់ ទទួលបានយប់ទី៤ ដោយឥតគិតថ្លៃ',
            'description'   => 'Reserve any private pool villa or overwater pavilion for four consecutive nights and receive your fourth night complimentary, alongside daily Champagne breakfast, roundtrip speedboat transfers, and a 60-minute couples massage.',
            'description_km'=> 'កក់វីឡាអាងហែលទឹកឯកជន ឬបឹងហ្គាឡូលើទឹក សម្រាប់ ៤យប់ជាប់គ្នា ទទួលបានយប់ទី៤ ឥតគិតថ្លៃ រួមជាមួយអាហារពេលព្រឹកសំប៉ាញ អូប័រទៅមក និងម៉ាស្សាគូស្នេហ៍ ៦០នាទី។',
            'cta_label'     => 'Reserve Privileged Stay',
            'cta_label_km'  => 'កក់ការស្នាក់នៅពិសេសនេះ',
            'valid_until'   => 'Valid for stays through December 2026.',
            'valid_until_km'=> 'មានសុពលភាពសម្រាប់ការស្នាក់នៅរហូតដល់ចុងខែធ្នូ ឆ្នាំ២០២៦។',
            'cta_path'      => '/booking',
        ];

        foreach ($rows as $key => $value) {
            $this->upsertScalar('promo', $key, $value);
        }
    }

    private function seedActivities(): void
    {
        $this->upsertJson('activities', 'items', [
            [
                'id'              => 'act-sunset-cruise',
                'title'           => 'Sunset Champagne Cruise',
                'title_km'        => 'ដំណើរកាតាម៉ារានពេលល្ងាច',
                'category'        => 'Ocean & Water',
                'category_km'     => 'សមុទ្រ & ទឹក',
                'duration'        => '2.5 Hours',
                'duration_km'     => '២.៥ ម៉ោង',
                'schedule'        => 'Daily · 5:30 PM',
                'schedule_km'     => 'រៀងរាល់ថ្ងៃ · ៥:៣០ ល្ងាច',
                'pricePerPerson'  => 95,
                'description'     => 'Sail the Gulf of Thailand aboard a private catamaran with chilled Champagne, canapés, and a live acoustic set as the horizon ignites in gold.',
                'description_km'  => 'ជិះកាតាម៉ារានឯកជនជាមួយសំប៉ាញ អាហារសម្រន់ និងតន្ត្រីអាក័ស្តិកពេលព្រះអាទិត្យលិច។',
                'image'           => '',
            ],
            [
                'id'              => 'act-bokor-tour',
                'title'           => 'Bokor Highlands Expedition',
                'title_km'        => 'ដំណើរផ្សងព្រេងភ្នំបូកគោ',
                'category'        => 'Expedition',
                'category_km'     => 'ដំណើរផ្សងព្រេង',
                'duration'        => 'Full Day',
                'duration_km'     => 'ពេញមួយថ្ងៃ',
                'schedule'        => 'Tue, Thu, Sat · 7:00 AM',
                'schedule_km'     => 'អង្គារ, ព្រហ, សៅរ៍ · ៧:០០ ព្រឹក',
                'pricePerPerson'  => 145,
                'description'     => 'Mist-shrouded peaks, French-colonial ruins, and cloud forests with gourmet picnic service and a dedicated naturalist guide.',
                'description_km'  => 'ភ្នំអ័ព្ទ ប្រាសាទបុរាណ និងព្រៃពណ៌ដូចពពក ជាមួយអាហារក្រៅបរិយាកាស និងមគ្គុទ្ទេសក៍ធម្មជាតិ។',
                'image'           => '',
            ],
            [
                'id'              => 'act-khmer-cooking',
                'title'           => 'Khmer Cooking Class',
                'title_km'        => 'ថ្នាក់ធ្វើម្ហូបខ្មែរ',
                'category'        => 'Culture & Culinary',
                'category_km'     => 'វប្បធម៌ & ម្ហូបអាហារ',
                'duration'        => '3 Hours',
                'duration_km'     => '៣ ម៉ោង',
                'schedule'        => 'Mon – Sat · 10:00 AM',
                'schedule_km'     => 'ច័ន្ទ – សៅរ៍ · ១០:០០ ព្រឹក',
                'pricePerPerson'  => 68,
                'description'     => 'From lemongrass paste to royal fish amok—harvest herbs in our garden kitchen and dine on your creations with paired Cambodian wines.',
                'description_km'  => 'រៀនធ្វើម្ហូបខ្មែរបុរាណ ប្រមូលស្មៅក្នុងសួន និងភานជាមួយទឹកជ្រូកកម្ពុជា។',
                'image'           => '',
            ],
            [
                'id'              => 'act-angkor-dawn',
                'title'           => 'Angkor Dawn Temple Journey',
                'title_km'        => 'ដំណើរប្រាសាទអង្គរពេលព្រឹក',
                'category'        => 'Culture & Culinary',
                'category_km'     => 'វប្បធម៌ & ម្ហូបអាហារ',
                'duration'        => '5 Hours',
                'duration_km'     => '៥ ម៉ោង',
                'schedule'        => 'Daily · 4:30 AM',
                'schedule_km'     => 'រៀងរាល់ថ្ងៃ · ៤:៣០ ព្រឹក',
                'pricePerPerson'  => 120,
                'description'     => 'Private access routes, scholar narration, and sunrise refreshments at Angkor Wat with luxury SUV transfers from Solara Siem Reap.',
                'description_km'  => 'ផ្លូវឯកជន ការបកស្រាយពីអ្នកសិក្សា និងអាហារពេលព្រឹកនៅអង្គរវត្ត ជាមួយឡាន SUV ពីសូឡារ៉ា។',
                'image'           => '',
            ],
            [
                'id'              => 'act-lotus-spa-ritual',
                'title'           => 'Lotus Renewal Ritual',
                'title_km'        => 'ពិធីស្តារឡូតុស',
                'category'        => 'Wellness & Spa',
                'category_km'     => 'សុខុមាលភាព & ស្ប៉ា',
                'duration'        => '90 Minutes',
                'duration_km'     => '៩០ នាទី',
                'schedule'        => 'Daily · 9:00 AM – 8:00 PM',
                'schedule_km'     => 'រៀងរាល់ថ្ងៃ · ៩:០០ ព្រឹក – ៨:០០ ល្ងាច',
                'pricePerPerson'  => 85,
                'description'     => 'Khmer herbal compress, warm oil massage, and sound bath in our cliffside spa pavilion overlooking the sea.',
                'description_km'  => 'ក្រមុំស្មៅ ម៉ាស្សាប្រេងក្តៅ និងសម្លេងសុខភាពនៅស្ប៉ាមាត់ជ្រោះ។',
                'image'           => '',
            ],
            [
                'id'              => 'act-island-snorkel',
                'title'           => 'Private Island Snorkeling',
                'title_km'        => 'ហែលទឹកមើលបារីកោះឯកជន',
                'category'        => 'Ocean & Water',
                'category_km'     => 'សមុទ្រ & ទឹក',
                'duration'        => '4 Hours',
                'duration_km'     => '៤ ម៉ោង',
                'schedule'        => 'Wed – Sun · 8:00 AM',
                'schedule_km'     => 'ពុធ – អាទិត្យ · ៨:០០ ព្រឹក',
                'pricePerPerson'  => 110,
                'description'     => 'Speedboat to secluded reefs with marine biologist guide, premium gear, and a castaway lunch on powder-white sand.',
                'description_km'  => 'ទូកល្បឿនលឿនទៅបារីជាមួយអ្នកជំនាញជីវវិទ្យាសមុទ្រ ឧបករណ៍ពិសេស និងអាហារថ្ងៃត្រង់នៅឆ្នេរស។',
                'image'           => '',
            ],
        ]);
    }

    private function seedServices(): void
    {
        $this->upsertJson('services', 'items', [
            [
                'id'            => 'svc-holistic-spa',
                'title'         => 'Holistic Spa Sanctuary',
                'title_km'      => 'ទីជម្រកស្ប៉ាសុខភាពទាំងមូល',
                'tagline'       => 'Ancient Khmer rituals, modern restoration',
                'tagline_km'    => 'ពិធីខ្មែរបុរាណ ការស្តារទំនើប',
                'description'   => 'Signature compress therapy, aromatherapy blends, and private hydrotherapy suites curated by master therapists.',
                'description_km'=> 'ក្រមុំស្មៅ ប្រេងក្រអូប និងបន្ទប់ព្យាបាលទឹកឯកជនដោយអ្នកជំនាញ។',
                'duration'      => '90 – 120 minutes',
                'duration_km'   => '៩០ – ១២០ នាទី',
                'priceFrom'     => 95,
                'features'      => ['Private treatment suites', 'Custom herbal blends', 'Ocean-view relaxation lounge'],
                'features_km'   => ['បន្ទប់ព្យាបាលឯកជន', 'សម្អាតផ្ទាល់ខ្លួន', 'បន្ទប់សម្រាកមើលសមុទ្រ'],
                'image'         => '',
            ],
            [
                'id'            => 'svc-private-butler',
                'title'         => 'Private Butler Guild',
                'title_km'      => 'ក្រុមប៊យធឺរផ្ទាល់ខ្លួន',
                'tagline'       => 'Anticipatory care, effortlessly delivered',
                'tagline_km'    => 'ការថែរក្សាមុនដៃ យ៉ាងរលូន',
                'description'   => 'Dedicated butler for unpacking, dining reservations, celebration styling, and seamless villa experiences.',
                'description_km'=> 'ប៊យធឺរផ្ទាល់ខ្លួនសម្រាប់ការកក់ម្ហូប ពិធីជប់លៀង និងបទពិសោធន៍វីឡា។',
                'duration'      => '24/7 during stay',
                'duration_km'   => '២៤/៧ ក្នុងពេលស្នាក់នៅ',
                'priceFrom'     => 0,
                'features'      => ['Complimentary for suite guests', 'VIP airport coordination', 'In-villa dining orchestration'],
                'features_km'   => ['ឥតគិតថ្លៃសម្រាប់សווីត', 'ការរៀបចំអាកាសយានដ្ឋាន', 'ម្ហូបក្នុងវីឡា'],
                'image'         => '',
            ],
            [
                'id'            => 'svc-floating-breakfast',
                'title'         => 'Floating Breakfast Experience',
                'title_km'      => 'បទពិសោធន៍អាហារពេលព្រឹកលើទឹក',
                'tagline'       => 'Champagne, tropical fruits, and stillness',
                'tagline_km'    => 'សំប៉ាញ ផ្លែឈើ និងសន្តិភាព',
                'description'   => 'A sculptural breakfast tray delivered to your private pool at dawn with barista service and live floral styling.',
                'description_km'=> 'អាហារពេលព្រឹកលើអាងហែលទឹកឯកជនជាមួយបារីស្តា និងផ្ការសម្អាត។',
                'duration'      => '90 minutes',
                'duration_km'   => '៩០ នាទី',
                'priceFrom'     => 65,
                'features'      => ['Photography moment', 'Dietary customization', 'Pool villa exclusive'],
                'features_km'   => ['ថតរូបពិសេស', 'កែតាមអាហារកំណត់', 'សម្រាប់វីឡាអាងហែលទឹក'],
                'image'         => '',
            ],
            [
                'id'            => 'svc-yacht-charter',
                'title'         => 'Solara Yacht Charter',
                'title_km'      => 'ជិះយ៉ាងដ៏សូឡារ៉ា',
                'tagline'       => 'Coastal glamour on your schedule',
                'tagline_km'    => 'ប្រណីតភាពមាត់សមុទ្រតាមកាលវិភាគអ្នក',
                'description'   => 'Luxury day yachts with captain, chef, and water toys for island hopping between Koh Rong, Kep, and secret coves.',
                'description_km'=> 'ទូកយ៉ាងដ៏ប្រណីតជាមួយកាប៉ាតិន អ្នកធ្វើម្ហូប និងកីឡាទឹកទៅកោះផ្សេងៗ។',
                'duration'      => 'Half or full day',
                'duration_km'   => 'កន្លះថ្ងៃ ឬពេញមួយថ្ងៃ',
                'priceFrom'     => 890,
                'features'      => ['Champagne welcome', 'Snorkel & paddle gear', 'Sunset return cruise'],
                'features_km'   => ['សំប៉ាញស្វាគមន៍', 'ឧបករណ៍ហែលទឹក', 'ដំណើរត្រឡប់ពេលល្ងាច'],
                'image'         => '',
            ],
        ]);
    }

    private function seedDining(): void
    {
        $this->upsertJson('dining', 'items', [
            [
                'id'            => 'dine-cliff-restaurant',
                'name'          => 'The Cliff Restaurant',
                'name_km'       => 'ភោជនីយដ្ឋានជ្រោះ',
                'cuisine'       => 'Contemporary Khmer & French',
                'cuisine_km'    => 'ខ្មែរទំនើប & បារាំង',
                'description'   => 'Clifftop fine dining with tasting menus, sommelier pairings, and uninterrupted Gulf sunsets.',
                'description_km'=> 'ម្ហូបជាចំណុចពិសេសលើជ្រោះ ជាមួយទឹកជ្រូក និងព្រះអាទិត្យលិច។',
                'hours'         => 'Dinner · 6:00 PM – 10:30 PM',
                'hours_km'      => 'អាហារពេលល្ងាច · ៦:០០ – ១០:៣០ យប់',
                'priceLevel'    => '$$$$',
                'image'         => '',
            ],
            [
                'id'            => 'dine-ocean-terrace',
                'name'          => 'Ocean Terrace',
                'name_km'       => 'ដងដៃមឹលសមុទ្រ',
                'cuisine'       => 'Seafood & Grill',
                'cuisine_km'    => 'សមុទ្រ & អាហារអាំង',
                'description'   => 'Open-air terrace for charcoal-grilled catch, raw bar towers, and live jazz on weekends.',
                'description_km'=> 'ដងដៃបើកខ្យល់សម្រាប់សមុទ្រអាំង និងតន្ត្រីជារៀងរាល់ចុងសប្តាហ៍។',
                'hours'         => 'Lunch & Dinner · 12:00 PM – 11:00 PM',
                'hours_km'      => 'អាហារថ្ងៃត្រង់ & ល្ងាច · ១២:០០ – ១១:០០ យប់',
                'priceLevel'    => '$$$',
                'image'         => '',
            ],
            [
                'id'            => 'dine-lotus-lounge',
                'name'          => 'Lotus Lounge',
                'name_km'       => 'ឡូតុសឡោនជ៍',
                'cuisine'       => 'Cocktails & Small Plates',
                'cuisine_km'    => 'គុជទឹក & អាហារសម្រន់',
                'description'   => 'Velvet banquettes, botanical infusions, and Khmer-inspired craft cocktails beside the infinity pool.',
                'description_km'=> 'សាឡុងប្រណីត គុជទឹកបុរាណខ្មែរ និងអាងហែលទឹកគ្មានទីបញ្ចប់។',
                'hours'         => 'Daily · 4:00 PM – 1:00 AM',
                'hours_km'      => 'រៀងរាល់ថ្ងៃ · ៤:០០ ល្ងាច – ១:០០ យប់',
                'priceLevel'    => '$$',
                'image'         => '',
            ],
            [
                'id'            => 'dine-beach-club',
                'name'          => 'Beach Club',
                'name_km'       => 'ប៊ីឆក្លាប់',
                'cuisine'       => 'Coastal Casual',
                'cuisine_km'    => 'ម្ហូបឆ្នេរសាមញ្ញ',
                'description'   => 'Barefoot luxury with wood-fired pizza, tropical bowls, and DJ sunsets on powder-white sand.',
                'description_km'=> 'ប្រណីតភាពដើរជើងទាក់ឆ្នេរ ភីហ្សា ប៊ូឡូទ្រព្យ និងពេលល្ងាចជាមួយ DJ។',
                'hours'         => 'Daily · 11:00 AM – 12:00 AM',
                'hours_km'      => 'រៀងរាល់ថ្ងៃ · ១១:០០ ព្រឹក – ១២:០០ យប់',
                'priceLevel'    => '$$',
                'image'         => '',
            ],
        ]);
    }

    private function seedAbout(): void
    {
        $scalars = [
            'hero_badge'       => 'The Solara Heritage',
            'hero_badge_km'    => 'មរតកសូឡារ៉ា',
            'hero_title'       => 'Mindful Luxury Rooted in Cambodian Serenity',
            'hero_title_km'    => 'ប្រណីតភាពមានគំនិត ជាប់ឫសខ្មែរស្ងប់ស្ងាត់',
            'hero_subtitle'    => 'Born from an architectural passion to preserve native craftsmanship while crafting sanctuaries of peerless contemporary comfort.',
            'hero_subtitle_km' => 'កើតចេញពីចំណង់ចំណូលចិត្តស្ថាបត្យកម្ម ដើម្បីរក្សាសិល្បៈមូលដ្ឋាន និងបង្កើតទីជម្រកប្រណីតភាពទំនើប។',
            'genesis_tag'      => 'Our Genesis',
            'genesis_tag_km'   => 'ប្រភពកំណើតរបស់យើង',
            'genesis_title'    => 'An Uncompromising Vision of Barefoot Refinement',
            'genesis_title_km' => 'ចក្ខុវិស័យប្រណីតភាពដើរជើងទាក់ដីយ៉ាងមិនប៉ះពាល់',
            'p1'               => 'Founded in 2018 along the secluded turquoise bays of Koh Rong, Solara began with a singular premise: luxury hospitality should breathe in harmony with its ancestral environment, rather than dominate it.',
            'p1_km'            => 'បង្កើតឡើងឆ្នាំ ២០១៨ នៅឆ្នេរកោះរ៉ុង សូឡារ៉ាចាប់ផ្តើមពីគោលការណ៍ថា ប្រណីតភាពគួររស់ជាមួយបរិស្ថាន មិនមែនគ្រប់គ្រងវា។',
            'p2'               => 'Over the past decade, our collection has grown into five distinct sanctuaries across Cambodia—from the mist-shrouded peaks of Bokor Highlands to the sacred banyan forests of Siem Reap and the quiet seaside glamour of Kep.',
            'p2_km'            => 'ក្នុងរយៈពេលជាងដប់ឆ្នាំ យើងមានទីជម្រក ៥ នៅកម្ពុជា ពីភ្នំបូកគោ សៀមរាប និងកែប។',
            'p3'               => 'Every pavilion, villa, and courtyard is hand-built in partnership with master Cambodian stone carvers, weavers, and bamboo artisans, blending timeless Khmer architectural balance with modern technological comfort.',
            'p3_km'            => 'រាល់សំណង វីឡា និងទីធ្លា ត្រូវបានសាងដោយជាងខ្មែរ បញ្ចូលសមតុល្យស្ថាបត្យកម្មខ្មែរបុរាណជាមួយបច្ចេកវិទ្យាទំនើប។',
            'value1_title'     => 'Zero-Waste & Conservation',
            'value1_title_km'=> 'សូន្យវេស្ត & ការពារធម្មជាតិ',
            'value1_desc'      => 'We operate single-use plastic free across all retreats, with on-site reverse osmosis water purification and solar micro-grids.',
            'value1_desc_km'   => 'គ្មានថង្ករប្លាស្ទិកប្រើម្តង ទឹកស្អាតក្នុងស្ថានីយ៍ និងថាមពលពន្លឺថ្ងៃ។',
            'value2_title'     => 'Local Heritage Craft Guild',
            'value2_title_km'=> 'សមាគមសិល្បៈមរតកក្នុងស្រុក',
            'value2_desc'      => 'Over 80% of our artisans and staff are from surrounding communities, preserving indigenous arts and ancient hospitality wisdom.',
            'value2_desc_km'   => 'ជាង ៨០% ជាជនព្រៃនៅសហគមន៍ជិតខាង រក្សាសិល្បៈ និងប្រណីតភាពបុរាណ។',
            'value3_title'     => 'Global Luxury Recognition',
            'value3_title_km'=> 'ការទទួលស្គាល់ប្រណីតភាពពិភពលោក',
            'value3_desc'      => 'Honored by Conde Nast Traveler and World Luxury Hotel Awards as Southeast Asia\'s most mindful sanctuary retreat.',
            'value3_desc_km'   => 'បានទទួលស្គាល់ពី Conde Nast Traveler និង World Luxury Hotel Awards។',
            'quote_text'       => '"We do not merely offer rooms. We craft moments of deep and lasting stillness."',
            'quote_text_km'    => '«យើងខ្ញុំមិនត្រឹមតែផ្តល់បន្ទប់ទេ ប៉ុន្តែបង្កើតពេលវេលាស្ងប់ស្ងាត់ជ្រៅ និងយូរអង្វែង។»',
            'quote_author'     => 'Experience our mindful hospitality at any of our five sanctuaries.',
            'quote_author_km'  => 'សូមអញ្ជើញមកទទួលបទពិសោធន៍នៅទីជម្រកទាំង ៥ របស់យើង។',
        ];

        foreach ($scalars as $key => $value) {
            $this->upsertScalar('about', $key, $value);
        }

        $this->upsertJson('about', 'values', [
            [
                'id'          => 'value-conservation',
                'title'       => 'Zero-Waste & Conservation',
                'title_km'    => 'សូន្យវេស្ត & ការពារធម្មជាតិ',
                'description' => 'Single-use plastic free operations with solar micro-grids and purified water stewardship.',
                'description_km' => 'គ្មានថង្ករប្លាស្ទិកប្រើម្តង ថាមពលពន្លឺថ្ងៃ និងទឹកស្អាត។',
            ],
            [
                'id'          => 'value-heritage',
                'title'       => 'Local Heritage Craft Guild',
                'title_km'    => 'សមាគមសិល្បៈមរតកក្នុងស្រុក',
                'description' => 'Community artisans preserving Khmer weaving, stone carving, and hospitality traditions.',
                'description_km' => 'ជាងក្នុងសហគមន៍រក្សាសិល្បៈខ្មែរ និងប្រណីតភាពបុរាណ។',
            ],
            [
                'id'          => 'value-awards',
                'title'       => 'Global Luxury Recognition',
                'title_km'    => 'ការទទួលស្គាល់ប្រណីតភាពពិភពលោក',
                'description' => 'Celebrated by international luxury travel editors and discerning resident guests.',
                'description_km' => 'បានទទួលស្គាល់ពីអ្នកសរសេរការធ្វើដំណើរប្រណីតភាពអន្តរជាតិ។',
            ],
        ]);
    }

    private function seedContact(): void
    {
        $rows = [
            'phone_primary'       => 'Worldwide Concierge',
            'phone_primary_km'    => 'ជំនួយការពិភពលោក',
            'phone_primary_value' => '+855 (0) 23 999 123',
            'phone_secondary'     => '+1 (800) 840-SOLARA',
            'email_primary'       => 'concierge@solararesorts.com',
            'email_secondary'     => 'reservations@solararesorts.com',
            'address'             => 'Solara Resort & Spa Group, National Road 6, Siem Reap 17252, Cambodia',
            'address_km'          => 'ក្រុមសូឡារ៉ា រមណីយដ្ឋាន អង់ ស្ប៉ា ផ្លូវជាតិលេខ ៦ សៀមរាប ១៧២៥២ កម្ពុជា',
            'hours_label'         => 'Butler Service Hours',
            'hours_label_km'      => 'ម៉ោងសេវាប៊យធឺរ',
            'hours_value'         => '24 Hours / 7 Days a Week',
            'hours_value_km'      => '២៤ ម៉ោង / ៧ ថ្ងៃក្នុងមួយសប្តាហ៍',
            'facebook_url'        => 'https://www.facebook.com/solararesorts',
            'telegram_url'        => 'https://t.me/solararesorts',
            'instagram_url'       => 'https://www.instagram.com/solararesorts',
        ];

        foreach ($rows as $key => $value) {
            $this->upsertScalar('contact', $key, $value);
        }
    }

    private function seedFooter(): void
    {
        $rows = [
            'checkin'      => '14:00',
            'checkout'     => '12:00',
            'copyright'    => 'Solara Resort & Spa Group. All rights reserved.',
            'copyright_km' => 'សូឡារ៉ា រមណីយដ្ឋាន អង់ ស្ប៉ា ក្រុម។ រក្សាសិទ្ធិគ្រប់យ៉ាង។',
        ];

        foreach ($rows as $key => $value) {
            $this->upsertScalar('footer', $key, $value);
        }
    }
}
