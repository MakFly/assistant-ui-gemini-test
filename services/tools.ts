import { FunctionDeclaration, Type, Tool } from "@google/genai";

// --- Mock Data ---
const MOCK_CARS = [
  {
    id: 'mock-1',
    title: 'Renault Clio V 1.0 TCe 100ch Intens',
    price: '16,990 €',
    year: '2021',
    mileage: '35,400 km',
    fuel: 'Essence',
    gearbox: 'Manuelle',
    location: 'Paris (75)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/2019_Renault_Clio_Iconic_TCe_100.jpg/1200px-2019_Renault_Clio_Iconic_TCe_100.jpg',
    link: 'https://www.renault.fr'
  },
  {
    id: 'mock-2',
    title: 'Peugeot 208 II 1.2 PureTech 100ch Allure',
    price: '17,500 €',
    year: '2022',
    mileage: '22,100 km',
    fuel: 'Essence',
    gearbox: 'Manuelle',
    location: 'Lyon (69)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Peugeot_208_II_IMG_3566.jpg/1200px-Peugeot_208_II_IMG_3566.jpg',
    link: 'https://www.peugeot.fr'
  },
  {
    id: 'mock-3',
    title: 'Tesla Model 3 Standard Plus',
    price: '34,900 €',
    year: '2021',
    mileage: '45,000 km',
    fuel: 'Électrique',
    gearbox: 'Automatique',
    location: 'Bordeaux (33)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2019_Tesla_Model_3_Performance_AWD_Front.jpg/1200px-2019_Tesla_Model_3_Performance_AWD_Front.jpg',
    link: 'https://www.tesla.com'
  },
   {
    id: 'mock-4',
    title: 'BMW Serie 1 118i 140ch M Sport',
    price: '28,900 €',
    year: '2023',
    mileage: '12,500 km',
    fuel: 'Essence',
    gearbox: 'Automatique',
    location: 'Nice (06)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/BMW_F40_IMG_2977.jpg/1200px-BMW_F40_IMG_2977.jpg',
    link: 'https://www.bmw.fr'
  }
];

// Helper to process API response into a clean format
const processCarData = (data: any) => {
  const simplifiedItems = (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    price: `${item.price} €`,
    year: item.attributes?.attr_car_year,
    mileage: `${item.attributes?.attr_car_mileage} km`,
    fuel: item.attributes?.attr_car_energy,
    gearbox: item.attributes?.attr_car_gearbox,
    location: `${item.localisation?.city} (${item.localisation?.postcode})`,
    imageUrl: item.mainImageUrl,
    link: `https://www.iautos.fr/annonce/${item.seoSlug}` 
  }));

  return { 
    count: data.totalItems,
    cars: simplifiedItems 
  };
};

// --- Tool Declarations (FunctionDeclaration) ---

const calculatorDeclaration: FunctionDeclaration = {
  name: 'calculator',
  description: 'Perform mathematical calculations. Use this for any math capability.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      expression: {
        type: 'STRING' as any,
        description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sin(0.5) * 3")',
      },
    },
    required: ['expression'],
  },
};

const searchCarsDeclaration: FunctionDeclaration = {
  name: 'search_cars',
  description: 'Search for cars for sale in France. Returns a list of vehicles with details like price, mileage, and images.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      query: {
        type: 'STRING' as any,
        description: 'The brand, model, or keywords to search for (e.g., "Renault Clio", "BMW X5").',
      },
      sortByPrice: {
        type: 'STRING' as any,
        enum: ['asc', 'desc'],
        description: 'Optional: Sort order for price.',
      }
    },
    required: ['query'],
  },
};

// --- Executable Implementations ---

async function calculate({ expression }: { expression: string }) {
  try {
    if (!/^[0-9+\-*/().\s^%Matha-z]+$/.test(expression)) {
      return "Error: Invalid characters in expression.";
    }
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();
    return String(result);
  } catch (error) {
    return "Error evaluating expression.";
  }
}

async function searchCars({ query, sortByPrice }: { query: string, sortByPrice?: 'asc' | 'desc' }) {
  const targetUrl = 'https://api.iautos.fr/api/v1/cars/search';
  const requestBody = {
    page: 1,
    limit: 12,
    search: query,
    subcategory: "sell",
    order: {
      price: sortByPrice || "asc",
      createdAt: "desc"
    }
  };

  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
       const data = await response.json();
       return processCarData(data);
    }
  } catch (error) {
    console.warn("Live search failed, falling back to mock data", error);
  }

  return { 
    result: "Successfully retrieved car listings (Demo Data).",
    data: {
        count: MOCK_CARS.length,
        cars: MOCK_CARS,
        note: "⚠️ Note: Live search failed or is restricted. Showing demonstration data."
    }
  };
}

// --- Exports ---

// Tool configurations for Agents
export const TOOLS = {
  calculator: {
    declaration: calculatorDeclaration,
    execute: calculate
  },
  searchCars: {
    declaration: searchCarsDeclaration,
    execute: searchCars
  }
};

// Tool Lists for Agent Config
export const ANALYST_TOOLS: Tool[] = [{ functionDeclarations: [calculatorDeclaration] }];
export const CAR_SPECIALIST_TOOLS: Tool[] = [{ functionDeclarations: [searchCarsDeclaration] }];
export const RESEARCHER_TOOLS: Tool[] = [{ googleSearch: {} }];

// Execution Map
export const EXECUTABLE_FUNCTIONS = {
  'calculator': calculate,
  'search_cars': searchCars
};