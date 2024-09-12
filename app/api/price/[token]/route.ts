const GET = async (
  request: Request,
  { params }: { params: { token: string } }
) => {
  try{
    let token = params.token;
    let priceInLamports = Math.floor(Math.random() * (1005 - 998 + 1)) + 998;
    return new Response(JSON.stringify(priceInLamports));
  }catch(e){
    return new Response(JSON.stringify(0));
  }
};

export { GET };
