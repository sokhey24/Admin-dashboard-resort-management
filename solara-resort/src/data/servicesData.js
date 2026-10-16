import { MARKETING_IMAGES } from '../constants/marketingImages.js';

/**
 * Local fixture catalog for the Services page UI.
 * Replace with CMS/API data when integrating the backend.
 */
export const SANCTUARY_FIXTURE = [
  {
    id: 'riverside',
    name: 'Solara Riverside Resort',
    name_km: 'Solara Riverside Resort',
  },
  {
    id: 'beach',
    name: 'Solara Beach Retreat',
    name_km: 'Solara Beach Retreat',
  },
  {
    id: 'mountain',
    name: 'Solara Mountain Sanctuary',
    name_km: 'Solara Mountain Sanctuary',
  },
];

export const SERVICES_FIXTURE = [
  {
    id: 'signature-spa-therapy',
    title: 'Signature Spa Therapy',
    title_km: 'ការព្យាបាលស្ប៉ពិសេស',
    tagline: 'A bespoke ritual for deep restoration',
    tagline_km: 'ពិធីផ្ទាល់ខ្លួនសម្រាប់ការសម្រាកជ្រៅ',
    description:
      'Our master therapists blend Khmer herbal compresses, aromatic oils, and slow-pressure massage in a private treatment suite overlooking the garden courtyard.',
    description_km:
      'អ្នកព្យាបាលរបស់យើងបញ្ចូលគ្នាក្រមុំស្មៅ ប្រេងក្រអូប និងម៉ាស្សាយយឺតក្នុងបន្ទប់ព្យាបាលឯកជន។',
    image: MARKETING_IMAGES.spa,
    duration: '90 minutes',
    duration_km: '៩០ នាទី',
    priceFrom: 95,
    features: [
      'Professional treatment by certified therapists',
      'Personalized aromatherapy blend',
      'Resort spa pavilion environment',
    ],
    features_km: [
      'ការព្យាបាលដោយអ្នកជំនាញដែលមានវិញ្ញាបនបត្រ',
      'ក្លិនក្លឹនប្រេងផ្ទាល់ខ្លួន',
      'បរិយាកាសស្ប៉ារមណីយដ្ឋាន',
    ],
  },
  {
    id: 'private-wellness-retreat',
    title: 'Private Wellness Retreat',
    title_km: 'ការសម្រាកសុខភាពឯកជន',
    tagline: 'A full half-day journey inward',
    tagline_km: 'ដំណើរការពាក់កណ្តាលថ្ងៃទៅកាន់សន្តិភាពខាងក្នុង',
    description:
      'Sequence hydrotherapy, guided meditation, and nourishing spa cuisine in a secluded villa wing reserved exclusively for you and your party.',
    description_km:
      'លំដាប់ព្យាបាលទឹក សមាធិណៈ និងម្ហូបសុខភាពនៅវិឡាឯកជនសម្រាប់អ្នកនិងភ្ញៀវរបស់អ្នក។',
    image: MARKETING_IMAGES.villa,
    duration: '4 hours',
    duration_km: '៤ ម៉ោង',
    priceFrom: 220,
    features: [
      'Dedicated wellness host',
      'Personalized program design',
      'Private relaxation lounge access',
    ],
    features_km: [
      'ម្ចាស់ផ្ទាល់សម្រាប់សុខភាព',
      'កម្មវិធីរចនាផ្ទាល់ខ្លួន',
      'ការចូលប្រើបន្ទប់សម្រាកឯកជន',
    ],
  },
  {
    id: 'traditional-khmer-healing',
    title: 'Traditional Khmer Healing',
    title_km: 'ការព្យាបាលបុរាណខ្មែរ',
    tagline: 'Heritage wisdom, gentle renewal',
    tagline_km: 'ប្រាជ្ញាបុរាណ ការស្តារទន់ភ្លន់',
    description:
      'Experience time-honored techniques using warm herbal poultices, reflex points, and restorative stretching passed through generations of Cambodian healers.',
    description_km:
      'បទពិសោធន៍បច្ចេកទេសបុរាណខ្មែរជាមួយក្រមុំស្មៅ ចំណុចបំពាក់ និងការលាងស្ទរីរ។',
    image: MARKETING_IMAGES.spa,
    duration: '75 minutes',
    duration_km: '៧៥ នាទី',
    priceFrom: 78,
    features: [
      'Authentic Khmer healing methods',
      'Custom herbal compress selection',
      'Tranquil treatment setting',
    ],
    features_km: [
      'វិធីព្យាបាលខ្មែរពិតប្រាកដ',
      'ក្រមុំស្មៅជម្រើសផ្ទាល់ខ្លួន',
      'បរិយាកាសស្ងប់ស្ងាត់',
    ],
  },
  {
    id: 'couples-relaxation-ritual',
    title: 'Couples Relaxation Ritual',
    title_km: 'ពិធីសម្រាកគូស្នេហ៍',
    tagline: 'Shared calm in a dual suite',
    tagline_km: 'សន្តិភាពរួមក្នុងបន្ទប់ពីរ',
    description:
      'Side-by-side massage, champagne botanical soak, and a candlelit rest period—crafted for anniversaries, honeymoons, or simply reconnecting.',
    description_km:
      'ម៉ាស្សាគូ ងូតទឹកប្រេង និងពេលសម្រាកជាមួយពន្លឺទៀន—សម្រាប់ថ្ងៃខួប ឬការភ្ជាប់ទំនាក់ទំនងឡើងវិញ។',
    image: MARKETING_IMAGES.dining,
    duration: '2 hours',
    duration_km: '២ ម៉ោង',
    priceFrom: 165,
    features: [
      'Synchronized couple treatment',
      'Private dual suite',
      'Celebration amenities on request',
    ],
    features_km: [
      'ការព្យាបាលគូរួមគ្នា',
      'បន្ទប់ពីរឯកជន',
      'អាហារពិសេសតាមសំណើ',
    ],
  },
  {
    id: 'sunrise-yoga-service',
    title: 'Sunrise Yoga',
    title_km: 'យ៉ូហ្គាពេលព្រឹក',
    tagline: 'Breath and balance at first light',
    tagline_km: 'ដង្ហា និងសមតុល្យពេលពន្លឺដំបូង',
    description:
      'Guided vinyasa and restorative poses on the ocean terrace with mats, towels, and post-session herbal tea included.',
    description_km:
      'យ៉ូហ្គាណែនំណាយជាមួយគ្រូនៅដងដៃមើលសមុទ្រ រួមគ្រាប់យ៉ូហ្គា កន្សែង និងតែបន្ទាប់ពីសមាធិ។',
    image: MARKETING_IMAGES.hero,
    duration: '60 minutes',
    duration_km: '៦០ នាទី',
    priceFrom: 15,
    features: [
      'Certified yoga instructor',
      'All levels welcome',
      'Scenic outdoor pavilion',
    ],
    features_km: [
      'គ្រូយ៉ូហ្គាមានវិញ្ញាបនបត្រ',
      'សម្រាប់គ្រប់កម្រិត',
      'វិចិត្រសាលក្រៅអាកាសស្អាត',
    ],
  },
  {
    id: 'wellness-consultation',
    title: 'Personal Wellness Consultation',
    title_km: 'ការពិគ្រោះសុខភាពផ្ទាល់ខ្លួន',
    tagline: 'Your stay, aligned to your goals',
    tagline_km: 'ការស្នាក់នៅរបស់អ្នកតាមគោលដៅ',
    description:
      'Meet with our wellness curator to design spa treatments, nutrition, movement, and rest rituals tailored to your residency.',
    description_km:
      'ជួបអ្នករៀបចំសុខភាពដើម្បីរចនាការព្យាបាល អាហារូបត្ថម្ភ និងពិធីសម្រាកតាមការស្នាក់នៅរបស់អ្នក។',
    image: MARKETING_IMAGES.spa,
    duration: '45 minutes',
    duration_km: '៤៥ នាទី',
    priceFrom: 0,
    features: [
      'One-on-one wellness planning',
      'Complimentary for villa guests',
      'Integrated resort itinerary',
    ],
    features_km: [
      'ផែនការសុខភាពផ្ទាល់ខ្លួន',
      'ឥតគិតថ្លៃសម្រាប់ភ្ញៀវវិឡា',
      'កាលវិភាគរួមបញ្ចូលរមណីយដ្ឋាន',
    ],
  },
];
