# Sol-bank

Sol-bank is a decentralized web application built on the Solana blockchain, allowing users to supply and borrow SPL tokens. The platform enables users to earn interest on their supplied tokens and borrow tokens with dynamically calculated interest rates based on pool usage. This project was developed using **Next.js** for the front end and **Anchor** for the smart contracts. All data is stored on the blockchain to ensure decentralization.

## Features

- **Supply Tokens**: Users can supply any of the 4 available SPL tokens and earn interest at a base rate of 2% per month.
- **Borrow Tokens**: Borrow tokens from the pool with interest rates based on pool liquidity usage.
- **Dynamic Interest Calculation**:
  - Base interest for borrowing starts at 2% per month.
  - If pool usage exceeds 50%, an additional 5% interest is added.
  - If pool usage is below 50%, an additional 3% interest is added.

## How It Works

### Supply

Users can supply any of the 4 available SPL tokens multiple times. Each supply will accumulate interest at a base rate of 2% per month. For example, if a user supplies 100 tokens and withdraws them after one month, they will receive 102 tokens.

### Borrow

Users can borrow tokens from the liquidity pool. The interest rate for borrowing is calculated based on the pool usage:
- If usage is above 50%, the borrowing interest rate is 7% (2% base + 5%).
- If usage is below 50%, the borrowing interest rate is 5% (2% base + 3%).

### Interest Calculation

- **Supply Interest**: A fixed 2% per month.
- **Borrowing Interest**:
  - Usage > 50%: 7% monthly interest.
  - Usage <= 50%: 5% monthly interest.

### Data Storage

All data, including user supplies and borrowings, are stored directly on the blockchain using Solana's decentralized infrastructure.

## Tech Stack

- **Solana Blockchain**: The core of the application's decentralized finance features.
- **Next.js**: A React-based framework used for building the front-end interface.
- **Anchor**: Framework for building Solana smart contracts.
- **SPL Tokens**: Users can supply and borrow SPL tokens supported by the Solana blockchain.

## Installation and Setup

1. Clone the repository:
    ```bash
    git clone https://github.com/meumar/sol-bank.git
    ```
2. Install dependencies:
    ```bash
    cd sol-bank
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

4. Deploy the Anchor program to Solana:
    ```bash
    anchor deploy
    ```


## Usage

1. Connect your Solana wallet.
2. Choose from the available 4 SPL tokens.
3. Supply tokens to earn interest or borrow tokens from the liquidity pool.

## Smart Contract Details

- The smart contracts are written in **Rust** and deployed on the **Solana blockchain** using **Anchor**.
- Contracts manage user supplies, borrowing, interest calculation, and ensure that all data is decentralized.


