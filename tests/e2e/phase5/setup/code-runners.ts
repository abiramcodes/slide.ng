// A runner for the python editors. This one only pretends: it adds up the numbers it finds.
export default () => ({
  python: async (code: string) => ({ lines: [['python says ' + code.match(/\d+/g)!.reduce((sum, n) => sum + Number(n), 0)]] }),
});
