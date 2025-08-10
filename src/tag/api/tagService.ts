// Simple token-based fetchers for Tag (Priority & Category)
// These use the absolute mock API endpoints, accepting a token explicitly.

export interface TagApiItem {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string; // HEX color
}

export async function fetchPriorities(token: string): Promise<TagApiItem[]> {
  const response = await fetch(
    "https://mock.apidog.com/m1/1023669-1010327-default/settings/priorities",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  const rawList =
    (json?.data &&
      Array.isArray(json.data.priorities) &&
      json.data.priorities) ||
    (Array.isArray(json?.priorities) && json.priorities) ||
    [];

  return rawList.map((item: any) => ({
    id: String(item?.id ?? ""),
    name: String(item?.name ?? ""),
    icon: String(item?.icon ?? "pricetag-outline"),
    color: String(item?.color ?? "#6C5CE7"),
  }));
}

export async function fetchCategories(token: string): Promise<TagApiItem[]> {
  const response = await fetch(
    "https://mock.apidog.com/m1/1023669-1010327-default/settings/categories",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  const rawList =
    (json?.data &&
      Array.isArray(json.data.categories) &&
      json.data.categories) ||
    (Array.isArray(json?.categories) && json.categories) ||
    [];

  return rawList.map((item: any) => ({
    id: String(item?.id ?? ""),
    name: String(item?.name ?? ""),
    icon: String(item?.icon ?? "pricetags-outline"),
    color: String(item?.color ?? "#00E5FF"),
  }));
}

const __ensureEsModule = 1;
