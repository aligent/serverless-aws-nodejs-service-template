export const handler = async ({ pokemon }: { pokemon: any }) => {
    return {
        name: pokemon.name,
        height: pokemon.height,
        weight: pokemon.weight,
    };
};
