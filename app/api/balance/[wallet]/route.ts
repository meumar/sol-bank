import { fromDecimals } from "@/utils";

const GET = async (
  request: Request,
  { params }: { params: { wallet: string } }
) => {
  try{
    const wallet = params.wallet;
    const [response1, response2] = await Promise.all([
      fetch(`${process.env.API_END_POINT}/api/supply?type=supply`, { cache: "no-store" }),
      fetch(`${process.env.API_END_POINT}/api/supply?type=loan`, { cache: "no-store" }),
    ]);
  
    const supply = await response1.json();
    const loan = await response2.json();
  
    const userSupply = supply.filter((s: any) => s.user == wallet);
    const userLoan = loan.filter((s: any) => s.user == wallet);
  
    const userTokens = [
      ...Array.from(new Set(userSupply.flatMap((t: any) => t.mint))),
      ...Array.from(new Set(userLoan.flatMap((t: any) => t.mint))),
    ];
  
    let prices: any = {};
    await Promise.all(
      userTokens.map(async (token: any) => {
        const res = await fetch(`${process.env.API_END_POINT}/api/price/${token}`);
        const price = await res.json();
        prices[token] = price;
        return token;
      })
    );
  
    let balance = 0,
      borrow = 0;
    userSupply.map((sup: any) => {
      let value = fromDecimals(sup.amount, 2) * prices[sup.mint];
      balance += value;
      return sup;
    });
  
    userLoan.map((sup: any) => {
      let value = fromDecimals(sup.amount, 2) * prices[sup.mint];
      borrow += value;
      return sup;
    });
  
    return new Response(JSON.stringify({ balance, borrow }));
  }catch(e){
    return new Response(JSON.stringify({}));
  }
};

export { GET };
