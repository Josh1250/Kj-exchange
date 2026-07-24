// config/giftCardRates.js
export const GIFT_CARD_RATES = {
  amazon: {
    name: 'Amazon',
    icon: 'fa-brands fa-amazon',
    countries: {
      USA: {
        physical: {
          'Cash Receipt (101-199)': 370,
          'Cash Receipt (50-100)': 370,
          'Cash Receipt (200-499)': 370,
          'Debit Receipt (101-199)': 370,
          'Debit Receipt (200-499)': 370,
          'Debit Receipt (50-100)': 370,
          'Gift Card (10-49)': 370,
          'No Receipt (500)': 370,
          'No Receipt (101+)': 370,
          'No Receipt & MasterCard (50-100)': 370,
        },
        ecode: {
          'Amazon E-code': 150,
        },
      },
      CANADA: {
        physical: {
          'Canada Amazon': 220,
        },
        ecode: {
          'Canada Amazon Ecode': 150,
        },
      },
      EURO: {
        physical: {
          'Germany Amazon': 240,
        },
        ecode: {
          'Germany Amazon Ecode': 150,
        },
      },
      UK: {
        physical: {
          'UK Amazon (10-49)': 380,
          'UK Amazon (50+)': 480,
        },
        ecode: {
          'UK Amazon E-code': 200,
        },
      },
      OTHER: {
        physical: {
          'Australia Amazon': 120,
        },
        ecode: {},
      },
    },
  },
  americanExpress: {
    name: 'American Express',
    icon: 'fa-regular fa-credit-card',
    countries: {
      USA: {
        physical: {
          'AMEX 3779 (100-199)': 200,
          'AMEX 3779 (200-399)': 220,
          'AMEX 3779 (400+)': 210,
          'AMEX 3779 (50-99)': 100,
        },
        ecode: {
          'AMEX Ecode (100+)': 80,
          'AMEX Ecode (25-99)': 80,
        },
      },
      CANADA: {
        physical: {
          'CAD AMEX (100-500)': 110,
        },
        ecode: {},
      },
    },
  },
  amexServe: {
    name: 'AMEX SERVE',
    icon: 'fa-regular fa-credit-card',
    countries: {
      USA: {
        physical: {
          'AMEX SERVE (100-500)': 100,
        },
        ecode: {},
      },
    },
  },
  apple: {
    name: 'Apple & iTunes',
    icon: 'fa-brands fa-apple',
    countries: {
      USA: {
        physical: {
          'iTunes/Apple 100 & 200': 1180,
          'Vertical Physical ($100,$200,$300,$400,$500)': 1050,
          'iTunes/Apple (below 100)': 1145,
          'iTunes/Apple (101-199 & 201-499)': 1145,
          'iTunes/Apple (300,400 & 500)': 1190,
          'iTunes/Apple (501+)': 700,
        },
        ecode: {
          'iTunes/Apple e-code (10-99)': 940,
          'iTunes/Apple e-code (100-500)': 950,
        },
      },
      CANADA: {
        physical: {
          'Canada iTunes (10-99)': 670,
          'Canada iTunes (100,200,300,400,500)': 695,
          'Canada iTunes (101-199,201-299,301-499)': 670,
        },
        ecode: {
          'Canada iTunes Ecode': 590,
        },
      },
      EURO: {
        physical: {
          'Austria iTunes 100+': 980,
          'Belgium iTunes 100': 980,
          'Belgium/Ireland iTunes (10-99)': 930,
          'Finland & France iTunes 100+': 970,
          'Finland, Netherlands iTunes (10-99)': 955,
          'France & Austria iTunes (10-99)': 955,
          'Germany iTunes (10-99)': 840,
          'Germany iTunes 100+': 980,
          'Ireland iTunes 100+': 980,
          'Italy iTunes (10-99)': 955,
          'Italy iTunes 100': 980,
          'Luxembourg, Greece, Portugal iTunes (10-99)': 955,
          'Luxembourg, Greece, Portugal iTunes 100+': 980,
          'Netherlands iTunes 100+': 970,
          'Spain iTunes (10-99)': 955,
          'Spain iTunes 100+': 980,
        },
        ecode: {
          'EURO ITUNES ECODE (10+)': 770,
        },
      },
      UK: {
        physical: {
          'UK iTunes (10-49 & 51-99)': 1115,
          'UK iTunes (100,200,300,400,500)': 1200,
          'UK iTunes 50': 1120,
          'UK iTunes/Apple (101-199 & 201-299)': 1195,
        },
        ecode: {
          'UK iTunes Ecode': 1025,
        },
      },
      OTHER: {
        physical: {
          'Australia iTunes (10-99)': 600,
          'Australia iTunes 100+': 630,
          'Brazil iTunes 50+': 70,
          'Brazil iTunes <50': 10,
          'Denmark iTunes': 65,
          'Hong Kong iTunes': 40,
          'Japan iTunes/Apple': 3,
          'Mexico iTunes/Apple': 10,
          'Norway iTunes': 20,
          'NZD iTunes 100': 550,
          'NZD iTunes (10-99)': 530,
          'Poland iTunes': 120,
          'Singapore iTunes 100': 100,
          'Singapore iTunes (20-99)': 85,
          'South Africa iTunes': 10,
          'Sweden iTunes': 20,
          'Switzerland iTunes (10-99)': 1120,
          'Switzerland iTunes 100+': 1100,
          'Taiwan iTunes': 10,
          'Turkey iTunes': 5,
          'UAE ITUNES': 120,
        },
        ecode: {
          'Australia iTunes Ecode': 450,
          'Brazil iTunes 50+ Ecode': 60,
          'Brazil iTunes <50 Ecode': 10,
          'Denmark iTunes Ecode': 65,
          'Hong Kong iTunes Ecode': 40,
          'Japan iTunes/Apple Ecode': 3,
          'Mexico iTunes/Apple Ecode': 10,
          'Norway iTunes Ecode': 20,
          'NZD iTunes Ecode': 460,
          'Poland iTunes Ecode': 120,
          'South Africa iTunes Ecode': 10,
          'Switzerland iTunes Ecode': 1030,
          'Taiwan iTunes Ecode': 10,
          'Turkey iTunes Ecode': 5,
          'UAE ITUNES Ecode': 120,
        },
      },
    },
  },
  bestBuy: {
    name: 'Best Buy',
    icon: 'fa-solid fa-laptop',
    countries: {
      USA: {
        physical: {
          'Best Buy': 180,
        },
        ecode: {},
      },
    },
  },
  ebay: {
    name: 'eBay',
    icon: 'fa-brands fa-ebay',
    countries: {
      USA: {
        physical: {
          'eBay Physical 100': 460,
          'eBay Physical 200': 460,
        },
        ecode: {},
      },
    },
  },
  footlocker: {
    name: 'Footlocker',
    icon: 'fa-solid fa-shoe-prints',
    countries: {
      USA: {
        physical: {
          'Footlocker (100+)': 1115,
          'Footlocker (50-99)': 800,
        },
        ecode: {
          'Footlocker Ecode (100+)': 200,
          'Footlocker Ecode (50-99)': 200,
        },
      },
    },
  },
  gamestop: {
    name: 'GameStop',
    icon: 'fa-solid fa-gamepad',
    countries: {
      USA: {
        physical: {
          'GameStop 100': 370,
        },
        ecode: {},
      },
    },
  },
  googlePlay: {
    name: 'Google Play',
    icon: 'fa-brands fa-google-play',
    countries: {
      USA: {
        physical: {
          'Google Play Physical': 810,
        },
        ecode: {},
      },
      CANADA: {
        physical: {
          'CAD Google Play': 370,
        },
        ecode: {},
      },
      EURO: {
        physical: {
          'EURO Google Play': 660,
        },
        ecode: {},
      },
      UK: {
        physical: {
          'UK Google Play': 600,
        },
        ecode: {
          'UK Google Play Ecode': 570,
        },
      },
      OTHER: {
        physical: {
          'Mexico Google Play': 5,
        },
        ecode: {},
      },
    },
  },
  macy: {
    name: 'Macy\'s',
    icon: 'fa-solid fa-store',
    countries: {
      USA: {
        physical: {
          'Macy\'s (100-300)': 1010,
          'Macy\'s (301+)': 720,
          'Macy\'s (50-99)': 800,
          'Macy\'s Physical (starts with 6)': 765,
        },
        ecode: {
          'Macy\'s Ecode': 320,
        },
      },
    },
  },
  nike: {
    name: 'Nike',
    icon: 'fa-solid fa-shoe-prints',
    countries: {
      USA: {
        physical: {
          'Nike (100-299)': 570,
          'Nike (300+)': 570,
          'Nike (<100)': 280,
        },
        ecode: {
          'Nike Ecode (100+)': 160,
        },
      },
    },
  },
  nordstrom: {
    name: 'Nordstrom',
    icon: 'fa-solid fa-store',
    countries: {
      USA: {
        physical: {
          'Nordstrom (100-500)': 800,
          'Nordstrom (25-99)': 720,
        },
        ecode: {
          'Nordstrom Ecode (300+)': 540,
          'Nordstrom Ecode (50-299)': 460,
        },
      },
    },
  },
  paysafecard: {
    name: 'Paysafecard',
    icon: 'fa-solid fa-credit-card',
    countries: {
      USA: {
        physical: {
          'Paysafecard (100-500)': 800,
          'Paysafecard (10-99)': 700,
        },
        ecode: {},
      },
      CANADA: {
        physical: {
          'Paysafecard (25-99)': 500,
          'Paysafecard (100-500)': 600,
        },
        ecode: {
          'Paysafecard Ecode (10-99)': 450,
          'Paysafecard Ecode (100-500)': 550,
        },
      },
      UK: {
        physical: {
          'Paysafecard (10-49)': 1112,
          'Paysafecard (50-150)': 1195,
        },
        ecode: {
          'Paysafecard Ecode (10-49)': 800,
          'Paysafecard Ecode (50-150)': 900,
        },
      },
    },
  },
  playstation: {
    name: 'PlayStation',
    icon: 'fa-solid fa-gamepad',
    countries: {
      USA: {
        physical: {
          'PlayStation': 150,
        },
        ecode: {},
      },
    },
  },
  razerGold: {
    name: 'Razer Gold',
    icon: 'fa-solid fa-dragon',
    countries: {
      USA: {
        physical: {
          'Razer Gold (14-codes)': 1120,
          'Razer Gold (16-codes)': 1070,
        },
        ecode: {
          'Razer Gold Ecode (14-codes)': 1120,
          'Razer Gold Ecode (16-codes)': 1070,
        },
      },
      CANADA: {
        physical: {
          'Canada Razer Gold': 800,
        },
        ecode: {
          'Canada Razer Gold Ecode': 780,
        },
      },
      EURO: {
        physical: {
          'Euro Razer Gold': 770,
        },
        ecode: {
          'Euro Razer Gold Ecode': 770,
        },
      },
      UK: {
        physical: {
          'UK Razer Gold (10-500)': 990,
        },
        ecode: {
          'UK Razer Gold Ecode (10-500)': 990,
        },
      },
      OTHER: {
        physical: {
          'Australia Razer Gold': 740,
          'Brazil Razer Gold': 150,
          'Malaysia Razer Gold': 230,
          'Mexico Razer Gold': 20,
          'Singapore Razer Gold': 790,
        },
        ecode: {
          'Australia Razer Gold Ecode': 740,
          'Brazil Razer Gold Ecode': 150,
          'Malaysia Razer Gold Ecode': 230,
          'Singapore Razer Gold Ecode': 790,
        },
      },
    },
  },
  roblox: {
    name: 'Roblox',
    icon: 'fa-solid fa-cube',
    countries: {
      USA: {
        physical: {
          'Roblox (25+)': 175,
        },
        ecode: {},
      },
    },
  },
  sephora: {
    name: 'Sephora',
    icon: 'fa-solid fa-spa',
    countries: {
      USA: {
        physical: {
          'Sephora (100-500)': 950,
          'Sephora (50-99)': 400,
        },
        ecode: {
          'Sephora Ecode (300+)': 600,
          'Sephora Ecode (50-299)': 600,
        },
      },
    },
  },
  steam: {
    name: 'Steam',
    icon: 'fa-solid fa-gamepad',
    countries: {
      USA: {
        physical: {
          'Steam': 900,
        },
        ecode: {
          'Steam Ecode': 900,
        },
      },
      CANADA: {
        physical: {
          'Canada Steam': 610,
        },
        ecode: {
          'Canada Steam Ecode': 610,
        },
      },
      EURO: {
        physical: {
          'EURO Steam': 1020,
        },
        ecode: {
          'EURO Steam Ecode': 1020,
        },
      },
      UK: {
        physical: {
          'UK Steam': 1200,
        },
        ecode: {
          'UK Steam Ecode': 1180,
        },
      },
      OTHER: {
        physical: {
          'Australia Steam': 555,
          'Brazil Steam': 100,
          'Dubai/Qatar/Saudi Arabia Steam': 140,
          'Hong Kong Steam': 100,
          'Indian Steam': 5,
          'Mexico Steam': 35,
          'New Zealand Steam': 505,
          'Poland Steam': 150,
          'South Africa Steam': 40,
          'Switzerland Steam (20+)': 1115,
          'Taiwan Steam': 25,
        },
        ecode: {
          'Australia Steam Ecode': 555,
          'Brazil Steam Ecode': 100,
          'Dubai/Qatar/Saudi Arabia Steam Ecode': 140,
          'Hong Kong Steam Ecode': 100,
          'Indian Steam Ecode': 5,
          'Mexico Steam Ecode': 35,
          'New Zealand Steam Ecode': 505,
          'Poland Steam Ecode': 150,
          'South Africa Steam Ecode': 40,
          'Switzerland Steam Ecode (20+)': 1115,
          'Taiwan Steam Ecode': 25,
        },
      },
    },
  },
  target: {
    name: 'Target',
    icon: 'fa-solid fa-store',
    countries: {
      USA: {
        physical: {
          'Target (100-400)': 200,
        },
        ecode: {},
      },
    },
  },
  vanilla: {
    name: 'Vanilla',
    icon: 'fa-solid fa-credit-card',
    countries: {
      USA: {
        physical: {
          'OneVanilla Visa/Mastercard (100-399)': 170,
          'OneVanilla Visa/Mastercard (25-99)': 130,
          'Vanilla Visa 4097/4118/5253 (400+)': 170,
          'Vanilla Visa 4097/4118/5253 (100-399)': 170,
        },
        ecode: {
          'Vanilla Visa/Mastercard Ecode (100+)': 80,
          'Vanilla Visa/Mastercard Ecode (25-99)': 50,
        },
      },
      CANADA: {
        physical: {
          'Canada OneVanilla (100-399)': 130,
          'Canada OneVanilla (50-99)': 60,
        },
        ecode: {},
      },
    },
  },
  visa: {
    name: 'Visa Gift Card',
    icon: 'fa-brands fa-cc-visa',
    countries: {
      USA: {
        physical: {
          'Visa 4034 & 4358 (100-199)': 200,
          'Visa 4034 & 4358 (200-299)': 200,
          'Visa 4034 & 4358 (300-500)': 220,
          'Visa 4034 & 4358 (50-99)': 80,
        },
        ecode: {
          'Visa Ecode (100-500)': 70,
        },
      },
      CANADA: {
        physical: {
          'Canada Visa/Perfect/Joker': 170,
        },
        ecode: {},
      },
    },
  },
  walmart: {
    name: 'Walmart',
    icon: 'fa-solid fa-store',
    countries: {
      USA: {
        physical: {
          'Walmart (100-299)': 200,
          'Walmart (300+)': 200,
          'Walmart (<100)': 200,
        },
        ecode: {
          'Walmart Ecode (50-299)': 80,
          'Walmart Ecode (300+)': 100,
        },
      },
    },
  },
  xbox: {
    name: 'Xbox',
    icon: 'fa-brands fa-xbox',
    countries: {
      USA: {
        physical: {
          'Xbox': 1010,
        },
        ecode: {
          'Xbox Ecode': 1010,
        },
      },
      CANADA: {
        physical: {
          'Canada Xbox': 600,
        },
        ecode: {
          'Canada Xbox Ecode': 600,
        },
      },
      EURO: {
        physical: {
          'Euro Xbox': 1010,
        },
        ecode: {
          'Euro Xbox Ecode': 1010,
        },
      },
      UK: {
        physical: {
          'UK Xbox': 1120,
        },
        ecode: {
          'UK Xbox Ecode': 1120,
        },
      },
      OTHER: {
        physical: {
          'Australia Xbox': 610,
          'NZD Xbox': 510,
          'Singapore Xbox': 620,
        },
        ecode: {
          'Australia Xbox Ecode': 610,
          'NZD Xbox Ecode': 510,
          'Singapore Xbox Ecode': 620,
        },
      },
    },
  },
  chime: {
    name: 'Chime',
    icon: 'fa-regular fa-bank',
    special: 'chime',
    countries: {
      USA: {
        physical: {
          'Chime Email (20-999)': 1120,
          'Chime Tag (20-999)': 1090,
        },
        ecode: {}, // no ecode for Chime
      },
    },
  },
  go2bank: {
    name: 'Go2bank',
    icon: 'fa-regular fa-credit-card',
    special: 'fee_usd_5',
    countries: {
      USA: {
        physical: {
          'Go2bank (100-500)': 900,
        },
        ecode: {},
      },
    },
  },
  greendot: {
    name: 'GreenDot',
    icon: 'fa-regular fa-credit-card',
    special: 'fee_usd_5',
    countries: {
      USA: {
        physical: {
          'GreenDot (100-500)': 930,
        },
        ecode: {},
      },
    },
  },
  moneypak: {
    name: 'MoneyPak',
    icon: 'fa-solid fa-credit-card',
    special: 'moneypak',
    countries: {
      USA: {
        physical: {
          'MoneyPak (100-500)': 1100,
        },
        ecode: {}, // ecode is actually "code" field
      },
    },
  },
};
