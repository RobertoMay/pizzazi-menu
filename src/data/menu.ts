export interface MenuItem {
  name: string;
  description?: string;
  price: number;
  options?: {
    name: string;
    price: number;
  }[];
  image?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuData: MenuSection[] = [
  {
    title: 'Pizzas',
    items: [
      {
        name: 'Al pastor',
        description:
          'Exquisita carne al pastor, tocino, cebolla, piña y nuestra selección de 3 quesos',
        price: 184,
        options: [
          { name: 'Sencilla', price: 184 },
          { name: 'Con orilla de queso', price: 209 },
        ],
        image: './images/p-1.png',
      },
      {
        name: 'Peperoni',
        description: 'Delicioso peperoni y nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-2.png',
      },
      {
        name: 'Especial',
        description:
          'Jamón, salchicha, pimiento, cebolla, chorizo, tocino y nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-3.png',
      },
      {
        name: 'Champiñón',
        description: 'Jamón, champiñones y nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-4.png',
      },
      {
        name: 'Hawaiana',
        description: 'Jamón, piña, salsa dulce y nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-5.png',
      },
      {
        name: 'Vegetariana',
        description:
          'Piña, champiñones, cebolla, pimiento, tomate y nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-6.png',
      },
      {
        name: 'Carne Asada',
        description:
          'Exquisita carne asada, tocino, cebolla y nuestra selección de 3 quesos',
        price: 184,
        options: [
          { name: 'Sencilla', price: 184 },
          { name: 'Con orilla de queso', price: 209 },
        ],
        image: './images/p-7.png',
      },
      {
        name: 'Mexicana',
        description:
          'Chorizo, tocino, cebolla, pimiento, chile jalapeño, nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-8.png',
      },
      {
        name: 'Salchicha',
        description: 'Salchicha y nuestra selección de 3 quesos',
        price: 99,
        options: [
          { name: 'Sencilla', price: 99 },
          { name: 'Con orilla de queso', price: 164 },
        ],
        image: './images/p-9.png',
      },
      {
        name: 'Tres Quesos',
        description:
          'Nuestra selección de 3 quesos: manchego, gouda y mozzarella',
        price: 99,
        options: [
          { name: 'Sencilla', price: 99 },
          { name: 'Con orilla de queso', price: 164 },
        ],
        image: './images/p-10.png',
      },
      {
        name: 'Jamón',
        description: 'Jamón y nuestra selección de 3 quesos',
        price: 99,
        options: [
          { name: 'Sencilla', price: 99 },
          { name: 'Con orilla de queso', price: 164 },
        ],
        image: './images/p-11.png',
      },
      {
        name: 'Asadera',
        description: 'Salchicha para asar nuestra selección de 3 quesos',
        price: 144,
        options: [
          { name: 'Sencilla', price: 144 },
          { name: 'Con orilla de queso', price: 174 },
        ],
        image: './images/p-12.png',
      },
    ],
  },
  {
    title: 'Hamburguesas',
    items: [
      {
        name: 'Especial',
        description:
          'Carne arrachera, jamón, queso, tocino, salchicha, vegetales, papas fritas',
        price: 75,
      },
      {
        name: 'Hawaiana',
        description:
          'Carne arrachera, doble jamón, queso, piña, vegetales, papas fritas',
        price: 75,
      },
      {
        name: 'BBQ',
        description:
          'Carne arrachera, jamón, queso, tocino, salchicha, salsa BBQ, vegetales, papas fritas',
        price: 75,
      },
      {
        name: 'Sencilla',
        description: 'Carne arrachera, jamón, queso y vegetales',
        price: 65,
      },
    ],
  },
  {
    title: 'Nachos',
    items: [
      {
        name: 'Grande',
        price: 135,
        description:
          'Tostadas, frijol, queso (2 capas), romanita, carne asado o pastor, mexicana, chile jalapeño y crema',
      },
      {
        name: 'Mediano',
        price: 115,
        description:
          'Tostadas, frijol, queso (2 capas), romanita, carne asado o pastor, mexicana, chile jalapeño y crema',
      },
      {
        name: 'Chico',
        price: 75,
        description:
          'Tostadas, frijol, queso (2 capas), romanita, carne asado o pastor, mexicana, chile jalapeño y crema',
      },
    ],
  },
  {
    title: 'Hot Dogs',
    items: [
      {
        name: 'Hot Dog Especial',
        price: 20,
        description: 'Salchicha, tocino, cebolla y carne',
      },
      {
        name: 'Hot Dog Sencillo',
        price: 15,
        description: 'Salchicha, tocino y cebolla',
      },
    ],
  },
  {
    title: 'Antojitos',
    items: [
      {
        name: 'Gringa',
        price: 25,
        description:
          'Tortilla de harina rellena de carne y queso. Disponible en Asado o Pastor',
      },
      {
        name: 'Burritos',
        price: 30,
        description:
          'Doble tortilla de harina, rellena de carne, frijol y queso. Disponible en Asado o Pastor',
      },
      {
        name: 'Tacos de Maíz',
        price: 20,
        description: 'Carne asada o de pastor (piña) y cebolla con cilantro',
      },
      {
        name: 'Tacos de Harina',
        price: 20,
        description: 'Carne asada o de pastor (piña) y cebolla con cilantro',
      },
      {
        name: 'Tortas',
        price: 28,
        description:
          'Frijol, mayonesa y cebolla con cilantro. Disponible en Asado o Pastor',
      },
    ],
  },
  {
    title: 'Complementos',
    items: [
      {
        name: 'Orden de Papas',
        price: 50,
      },
      {
        name: 'Pan con Ajo y Queso',
        price: 40,
      },
      {
        name: 'Champiñón Extra',
        price: 15,
      },
      {
        name: 'Queso Extra (para tacos)',
        price: 5,
      },
    ],
  },
];

export interface Location {
  name: string;
  address: string;
  phones: string[];
}

export const locations: Location[] = [
  {
    name: 'MAXCANÚ',
    address: 'C 22 x 15 y 17 centro',
    phones: ['99-94-15-36-80', '99-71-34-31-90', '99-79-71-26-83'],
  },
  {
    name: 'HALACHÓ',
    address: '',
    phones: ['99-71-18-17-60', '99-71-07-09-49', '99-76-88-20-30'],
  },
  {
    name: 'DZITBALCHÉ',
    address: '',
    phones: ['99-61-04-08-86', '99-96-63-35-37', '99-66-88-08-66'],
  },
];
