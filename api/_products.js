export const PRODUCTS = {
  'beginner-home-fitness-starter-pack-pulse-x': {
    name: 'Beginner Home Fitness Starter Pack (PULSE X)',
    price: 31.99,
    image: 'https://i.imgur.com/goLdROP.png',
    planId: 'plan_30zEjNIW4Z7gk'
  },
  'full-fitness-course-and-program-ace': {
    name: 'Full Fitness Course & Program (ACE)',
    price: 35.99,
    image: 'https://i.imgur.com/XBxnHhB.jpeg',
    planId: 'plan_F2oHmKSE95sRo'
  },
  'test': {
    name: 'test',
    price: 12.00,
    image: '',
    planId: 'plan_9y00NPFcGJqPB'
  },
  'yoga-and-fitness-program-10pc': {
    name: 'Yoga And Fitness Program (10PC)',
    price: 125.99,
    image: 'https://i.imgur.com/XBxnHhB.jpeg',
    planId: 'plan_0q4hHbMZMXMdM'
  },
  'elite-fitness-program-10pc': {
    name: 'Elite Fitness Program (10PC)',
    price: 135.99,
    image: 'https://i.imgur.com/3p7KvHg.png',
    planId: 'plan_4vCBTOV8aAf94'
  },
  'health-and-fitness-mastery-10pc': {
    name: 'Health & Fitness Mastery (10PC)',
    price: 195.99,
    image: 'https://i.imgur.com/w3YvW60.png',
    planId: 'plan_E5ePAbjIvxM9C'
  },
  'complete-fitness-and-yoga-course-v5': {
    name: 'Complete Fitness & Yoga Course (V5)',
    price: 35.99,
    image: 'https://i.imgur.com/3p7KvHg.png',
    planId: 'plan_Crcigumz9kQrI'
  },
  'full-fitness-and-yoga-course-raw-g': {
    name: 'Full Fitness & Yoga Course (RAW G)',
    price: 42.99,
    image: 'https://i.imgur.com/w3YvW60.png',
    planId: 'plan_bcoAlyl6FzUrh'
  },
  '30-day-fitness-program-cookies-collab': {
    name: '30 Day Fitness Program (COOKIES COLLAB)',
    price: 38.99,
    image: 'https://i.imgur.com/Ycm4t19.jpeg',
    planId: 'plan_4Zk0eqMcIdhSN'
  },
  'complete-fitness-and-yoga-program-20pc': {
    name: 'Complete Fitness & Yoga Program (20PC)',
    price: 205.99,
    image: 'https://i.imgur.com/XBxnHhB.jpeg',
    planId: 'plan_CyTQfPadPJYMa'
  },
  'beginner-home-fitness-starter-pack-3rd-gen': {
    name: 'Beginner Home Fitness Starter Pack (3RD GEN)',
    price: 35.99,
    image: 'https://i.imgur.com/Ycm4t19.jpeg',
    planId: 'plan_1HueGnQN78D98'
  }
};

export const SHIPPING_OPTIONS = {
  'usps-free': {
    label: 'USPS Standard',
    eta: '2-3 business days',
    price: 0.00
  },
  'fedex-express': {
    label: 'FedEx Express',
    eta: '1-2 business days',
    price: 5.99
  }
};

export function getProduct(id) {
  return PRODUCTS[id] || null;
}

export function getShipping(id) {
  return SHIPPING_OPTIONS[id] || SHIPPING_OPTIONS['usps-free'];
}
