export const handler = async ({ name }: { name: string }) => {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch pokemon: ${response.statusText}`);
    }

    return await response.json();
};
