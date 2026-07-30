import { supabase } from '../../supabase/client';

export interface ParsedDeliveryItem {
  nombre: string;
  cantidad: number;
  precioCoste: number | null;
  marca: string | null;
  referenciaProveedor: string | null;
  categoria?: string | null;
}

export interface ParsedDeliveryNote {
  items: ParsedDeliveryItem[];
  proveedor: string | null;
  fecha: string | null;
  numeroAlbaran: string | null;
  error: string | null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Apparel': [
    'sabana', 'sábanas', 'juego de cama', 'juego de sabanas', 'juego de sábanas',
    'franela', 'algodon', 'algodón', 'fundas', 'funda', 'edredon', 'edredón',
    'manta', 'mantas', 'toalla', 'toallas', 'cortina', 'cortinas', 'ropa de cama',
    'camiseta', 'camisetas', 'pantalon', 'pantalón', 'pantalones', 'vestido', 'vestidos',
    'chaqueta', 'chaquetas', 'abrigo', 'abrigos', 'calcetin', 'calcetines',
    'ropa interior', 'sujetador', 'sujetadores', 'bragas', 'camisa', 'camisas',
    'jersey', 'jerseys', 'sueter', 'suéter', 'sudadera', 'sudaderas',
    'falda', 'faldas', 'blusa', 'blusas', 'camisola', 'camisolas',
    'pijama', 'pijamas', 'bata', 'batas', 'gorro', 'gorros', 'bufanda', 'bufandas',
    'guantes', 'cinturon', 'cinturón', 'zapatos', 'zapatillas', 'botas', 'sandalias',
    'sabana bajera', 'sabana encimera', 'fundas de almohada', 'almohada', 'almohadas',
    'colcha', 'colchas', 'cojin', 'cojín', 'cojines', 'nordico', 'nórdico',
  ],
  'Electronics': [
    'cable', 'cables', 'cargador', 'cargadores', 'auriculares', 'pila', 'pilas',
    'bateria', 'batería', 'baterias', 'baterías', 'ordenador', 'ordenadores',
    'movil', 'móvil', 'moviles', 'móviles', 'telefono', 'teléfono', 'telefonos', 'teléfonos',
    'altavoz', 'altavoces', 'teclado', 'teclados', 'raton', 'ratón', 'ratones',
    'pantalla', 'pantallas', 'monitor', 'monitores', 'televisor', 'televisores', 'tv',
    'radio', 'radios', 'lampara', 'lámpara', 'lamparas', 'lámparas',
    'bombilla', 'bombillas', 'led', 'usb', 'hdmi', 'bluetooth', 'wifi', 'router',
    'cargador coche', 'powerbank', 'power bank', 'bateria externa',
  ],
  'Food': [
    'galletas', 'galleta', 'chocolate', 'chocolates', 'cafe', 'café', 'cafes', 'cafés',
    'aceite', 'aceites', 'conservas', 'conserva', 'pasta', 'pastas', 'arroz',
    'harina', 'harinas', 'azucar', 'azúcar', 'sal', 'sales', 'especias', 'especia',
    'cereales', 'cereal', 'mermelada', 'mermeladas', 'miel', 'snack', 'snacks',
    'frutos secos', 'fruto seco', 'nueces', 'almendras', 'pipas', 'chicles', 'chicle',
    'caramelo', 'caramelos', 'chuche', 'chuches', 'golosina', 'golosinas',
    'yogur', 'yogures', 'yogurt', 'yogurts', 'queso', 'quesos', 'jamon', 'jamón',
    'embutido', 'embutidos', 'salsa', 'salsas', 'sopa', 'sopas', 'pure', 'puré',
    'atun', 'atún', 'sardinas', 'mejillones', 'alubias', 'lentejas', 'garbanzos',
  ],
  'Drinks': [
    'refresco', 'refrescos', 'zumo', 'zumos', 'cerveza', 'cervezas', 'vino', 'vinos',
    'licor', 'licores', 'agua', 'leche', 'leches', 'cava', 'cavas', 'whisky', 'ron',
    'ginebra', 'vermouth', 'vermú', 'vermut', 'soda', 'tonica', 'tónica',
    'bebida', 'bebidas', 'isotonico', 'isotónico', 'energetico', 'energético',
    'batido', 'batidos', 'smoothie', 'smoothies', 'infusion', 'infusión', 'te', 'té',
    'cola', 'fanta', 'sprite', 'nestea', 'aquarius', 'powerade',
  ],
  'Bakery': [
    'pan', 'panes', 'bolleria', 'bollería', 'pasteles', 'pastel', 'croissant', 'croissants',
    'magdalena', 'magdalenas', 'tarta', 'tartas', 'bizcocho', 'bizcochos',
    'pan de molde', 'baguette', 'baguettes', 'bollos', 'bollo', 'donut', 'donuts',
    'rosquilla', 'rosquillas', 'churros', 'churro', 'empanada', 'empanadas',
    'ensaimada', 'ensaimadas', 'napolitana', 'napolitanas', 'palmera', 'palmeras',
    'muffin', 'muffins', 'cookies', 'cookie', 'brownie', 'brownies',
  ],
};

export function detectCategory(productName: string, systemCategories: string[]): string | null {
  const normalized = productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const cat of systemCategories) {
    const normalizedCat = cat
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (normalizedCat.length > 2 && normalized.includes(normalizedCat)) {
      return cat;
    }
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!systemCategories.includes(category)) continue;
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

export async function processDeliveryNote(
  text: string,
  tenantId: string
): Promise<ParsedDeliveryNote> {
  const { data, error } = await supabase.functions.invoke('process-delivery-note', {
    body: { text, tenantId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to process delivery note');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    items: data?.items || [],
    proveedor: data?.proveedor || null,
    fecha: data?.fecha || null,
    numeroAlbaran: data?.numeroAlbaran || null,
    error: data?.error || null,
  };
}

export async function processDeliveryNoteVision(
  file: File,
  tenantId: string
): Promise<ParsedDeliveryNote> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tenantId', tenantId);

  const { data, error } = await supabase.functions.invoke('process-delivery-note-vision', {
    body: formData,
  });

  if (error) {
    throw new Error(error.message || 'Failed to process delivery note with vision');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    items: data?.items || [],
    proveedor: data?.proveedor || null,
    fecha: data?.fecha || null,
    numeroAlbaran: data?.numeroAlbaran || null,
    error: data?.error || null,
  };
}

export async function suggestCategory(
  productName: string,
  systemCategories: string[]
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('suggest-category', {
      body: { productName, categories: systemCategories },
    });

    if (error || data?.error) {
      console.warn('Category suggestion failed:', error || data?.error);
      return null;
    }

    return data?.suggestion || null;
  } catch (err) {
    console.warn('Category suggestion error:', err);
    return null;
  }
}

export function assignCategories(
  note: ParsedDeliveryNote,
  systemCategories: string[]
): ParsedDeliveryNote {
  return {
    ...note,
    items: note.items.map(item => ({
      ...item,
      categoria: detectCategory(item.nombre, systemCategories),
    })),
  };
}
