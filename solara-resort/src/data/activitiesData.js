import { MARKETING_IMAGES } from '../constants/marketingImages.js';

/**
 * Local fixture catalog for the Activities page UI.
 * Replace this import with API/CMS data when integrating the backend.
 */
export const ACTIVITIES_FIXTURE = [
  {
    id: 'sunset-beach-walk',
    title: 'Sunset Beach Walk',
    title_km: 'ដើរលេងឆ្នេរពេលល្ងាច',
    category: 'Nature',
    category_km: 'ធម្មជាតិ',
    description:
      'Stroll golden sands with a resort naturalist as the sun melts into the Gulf—shell spotting, gentle tides, and a chilled welcome drink at the finale.',
    description_km:
      'ដើរលេងឆ្នេរពេលល្ងាចជាមួយមគ្គុទ្ទេសក៍ ស្វែងរកខ្យង និងទទួលភេសជ្ជៈត្រជាក់នៅចុងបញ្ចប់។',
    image: MARKETING_IMAGES.hero,
    duration: '75 minutes',
    duration_km: '៧៥ នាទី',
    schedule: 'Daily · 5:45 PM',
    schedule_km: 'រៀងរាល់ថ្ងៃ · ៥:៤៥ ល្ងាច',
    pricePerPerson: 18,
  },
  {
    id: 'traditional-khmer-cooking',
    title: 'Traditional Khmer Cooking',
    title_km: 'ធ្វើម្ហូបខ្មែរបុរាណ',
    category: 'Culture',
    category_km: 'វប្បធម៌',
    description:
      'From fragrant lemongrass paste to caramelized fish amok—work alongside our chefs in an open-air pavilion using market-fresh ingredients.',
    description_km:
      'រៀនធ្វើម្ហូបខ្មែរបុរាណជាមួយអ្នកធ្វើម្ហូប ប្រើគ្រឿងផ្សំស្រស់ពីផ្សារក្នុងវិចិត្រសាលបើកខ្យល់។',
    image: MARKETING_IMAGES.dining,
    duration: '2.5 hours',
    duration_km: '២.៥ ម៉ោង',
    schedule: 'Tue, Thu, Sat · 10:00 AM',
    schedule_km: 'អង្គារ, ព្រហ, សៅរ៍ · ១០:០០ ព្រឹក',
    pricePerPerson: 55,
  },
  {
    id: 'sunrise-yoga',
    title: 'Sunrise Yoga',
    title_km: 'យ៉ូហ្គាពេលព្រឹក',
    category: 'Wellness',
    category_km: 'សុខភាព',
    description:
      'Begin your day with breath-led flows on our ocean-view deck—suitable for all levels, with herbal tea and light fruit afterward.',
    description_km:
      'ចាប់ផ្តើមថ្ងៃជាមួយយ៉ូហ្គាលើដងដៃមើលសមុទ្រ សម្រាប់គ្រប់កម្រិត ជាមួយតែខ្មៅ និងផ្លែឈើបន្តិចបន្តួច។',
    image: MARKETING_IMAGES.spa,
    duration: '60 minutes',
    duration_km: '៦០ នាទី',
    schedule: 'Daily · 6:30 AM',
    schedule_km: 'រៀងរាល់ថ្ងៃ · ៦:៣០ ព្រឹក',
    pricePerPerson: 15,
  },
  {
    id: 'kayaking-adventure',
    title: 'Kayaking Adventure',
    title_km: 'ដំណើរកាយ៉ាក់',
    category: 'Adventure',
    category_km: 'ផ្សងព្រេង',
    description:
      'Paddle sheltered lagoons and mangrove channels with safety briefing, guided routes, and time to swim in crystal-clear coves.',
    description_km:
      'ជិះកាយ៉ាក់ក្នុងទឹកស្ងប់ស្ងាត់ និងព្រៃបៃតង ជាមួយមគ្គុទ្ទេសក៍ និងពេលហែលទឹកនៅឆ្នេរស្អាត។',
    image: MARKETING_IMAGES.villa,
    duration: '3 hours',
    duration_km: '៣ ម៉ោង',
    schedule: 'Mon – Sat · 8:30 AM',
    schedule_km: 'ច័ន្ទ – សៅរ៍ · ៨:៣០ ព្រឹក',
    pricePerPerson: 42,
  },
  {
    id: 'khmer-cultural-experience',
    title: 'Khmer Cultural Experience',
    title_km: 'បទពិសោធន៍វប្បធម៌ខ្មែរ',
    category: 'Culture',
    category_km: 'វប្បធម៌',
    description:
      'An intimate afternoon of classical dance, silk weaving demonstration, and storytelling rooted in Cambodia’s living heritage.',
    description_km:
      'រសៀលជាមួយរបាំបុរាណ បង្ហាញការត្បាញសរសយ្យ និងរឿងបុរាណខ្មែរ។',
    image: MARKETING_IMAGES.dining,
    duration: '2 hours',
    duration_km: '២ ម៉ោង',
    schedule: 'Wed & Sun · 3:00 PM',
    schedule_km: 'ពុធ & អាទិត្យ · ៣:០០ ល្ងាច',
    pricePerPerson: 35,
  },
  {
    id: 'cycling-tour',
    title: 'Cycling Tour',
    title_km: 'ដំណើរកង់ទស្សនា',
    category: 'Adventure',
    category_km: 'ផ្សងព្រេង',
    description:
      'Coastal village loops on premium hybrid bikes—village markets, rice paddies, and a riverside refreshment stop with your guide.',
    description_km:
      'ជិះកង់រុករកភូមិឆ្នេរ ផ្សារ ស្រែ និងសម្រាកភេសជ្ជៈនៅរបៀងទន្លេជាមួយមគ្គុទ្ទេសក៍។',
    image: MARKETING_IMAGES.hero,
    duration: '2 hours',
    duration_km: '២ ម៉ោង',
    schedule: 'Daily · 7:00 AM',
    schedule_km: 'រៀងរាល់ថ្ងៃ · ៧:០០ ព្រឹក',
    pricePerPerson: 28,
  },
];

export const ACTIVITY_CATEGORY_VALUES = ['All', 'Adventure', 'Wellness', 'Culture', 'Nature'];
