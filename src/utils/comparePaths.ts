export const comparePaths = (a: string[], b: string[]): boolean => {
    return a.length === b.length &&  a.every((value, index) => value === b[index])
}