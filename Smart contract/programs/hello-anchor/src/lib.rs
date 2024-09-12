use anchor_lang::prelude::*;
// use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("7anLsghUZvzHbmnM5GWq8ENLNgqzZ1W9gj5o6DxNneAC");

#[program]
mod hello_anchor {
    use super::*;
    //Create program wallet
    pub fn create_bank_wallet(_ctx: Context<CreateBankWallet>) -> Result<()> {
        msg!("Bank wallet created");
        Ok(())
    }

    //Create nft token account
    pub fn create_bank_token_account(_ctx: Context<CreateTokenAccount>) -> Result<()> {
        msg!("Bank token account created");
        Ok(())
    }

    //Create bank supply certificate
    pub fn add_supply(ctx: Context<AddSupply>, rkey: String, amount: u64) -> Result<()> {
        let user = &ctx.accounts.signer;
        let user_ata = &ctx.accounts.user_ata;

        let destination = &ctx.accounts.program_ata;
        let token_program = &ctx.accounts.token_program;

        if ctx.accounts.program_wallet.owner != ctx.program_id {
            return err!(BankError::InvalidAccount);
        }

        if ctx.accounts.program_wallet.key().to_string() != destination.owner.key().to_string() {
            return err!(BankError::InvalidAccount);
        }

        //Check user has balance
        let user_amount: u64 = ctx.accounts.user_ata.amount;
        msg!("User balance {}", user_amount);
        if user_amount < amount {
            return err!(BankError::InsufficientBalance);
        }
        //Transfer bank from user
        let cpi_accounts = SplTransfer {
            from: user_ata.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: user.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        let account_data = &mut ctx.accounts.supply_certificate;
        let clock = Clock::get()?;

        // Adding supplying details
        account_data.account_type = "SUPPLY".to_string();
        account_data.user = *ctx.accounts.signer.key;
        account_data.mint = ctx.accounts.mint.key();
        account_data.amount = amount;
        account_data.timestamp = clock.unix_timestamp as u64;
        msg!("Supply account created and key is {}", rkey);
        Ok(())
    }

    //Create borrow certificate
    pub fn borrow_amount(
        ctx: Context<BorrowAmount>,
        rkey: String,
        loan_amount: u64,
        col_amount: u64,
        bump: u8,
        interest_rate: u8,
    ) -> Result<()> {
        let token_program = &ctx.accounts.token_program;

        let user = &ctx.accounts.signer;

        let user_col_ata = &ctx.accounts.user_col_ata;
        let program_col_ata = &ctx.accounts.program_col_ata;

        let user_loan_ata = &ctx.accounts.user_loan_ata;
        let program_loan_ata = &ctx.accounts.program_loan_ata;

        let program_amount: u64 = ctx.accounts.program_loan_ata.amount;
        msg!("Program balance {}", program_amount);
        if program_amount < loan_amount {
            return err!(BankError::InsufficientBankBalance);
        }

        if ctx.accounts.program_col_wallet.owner != ctx.program_id {
            return err!(BankError::InvalidAccount);
        }

        if ctx.accounts.program_col_wallet.key().to_string()
            != program_col_ata.owner.key().to_string()
        {
            return err!(BankError::InvalidAccount);
        }
        if col_amount < (loan_amount as f64 * 1.2) as u64 {
            return err!(BankError::InvalidCollateral);
        }

        let user_amount: u64 = ctx.accounts.user_col_ata.amount;
        msg!("User balance {}", user_amount);
        if user_amount < col_amount {
            return err!(BankError::InsufficientBalance);
        }

        //Transfer bank from user
        let cpi_accounts = SplTransfer {
            from: user_col_ata.to_account_info().clone(),
            to: program_col_ata.to_account_info().clone(),
            authority: user.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), col_amount)?;

        //Transfer NFT from user
        let bump_vector = bump.to_le_bytes();
        let inner = vec![b"wallet".as_ref(), bump_vector.as_ref()];
        let outer = vec![inner.as_slice()];

        let transfer_instruction = SplTransfer {
            from: program_loan_ata.to_account_info(),
            to: user_loan_ata.to_account_info(),
            authority: ctx.accounts.program_loan_wallet.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::transfer(cpi_ctx, loan_amount)?;

        let account_data = &mut ctx.accounts.borrow_certificate;
        let clock = Clock::get()?;
        // Adding supplying details
        account_data.account_type = "LOAN".to_string();
        account_data.user = *ctx.accounts.signer.key;
        account_data.mint = ctx.accounts.mint.key();
        account_data.amount = loan_amount;
        account_data.timestamp = clock.unix_timestamp as u64;
        account_data.coll_mint = ctx.accounts.col_mint.key();
        account_data.coll_amount = col_amount;
        account_data.status = 1;
        account_data.interest_rate = interest_rate;
        msg!("Loan amount transfered succefully and key is {}", rkey);
        Ok(())
    }

    //Repay borrowed amount
    pub fn repayment_amount(
        ctx: Context<RepaymentAmount>,
        loan_amount: u64,
        col_amount: u64,
        days: u64,
        bump: u8,
    ) -> Result<()> {
        let account_data = &mut ctx.accounts.borrow_certificate;
        let monthly_interest =
            account_data.amount as f64 * (account_data.interest_rate as f64 / 100.0);
        let days_as_float = days as f64;
        let adjusted_interest = (days_as_float / 30.0) * monthly_interest;
        let adjusted_interest = adjusted_interest as u64;
        let amount = account_data.amount + adjusted_interest;

        if amount != loan_amount {
            return err!(BankError::InvalidRepayment);
        }
        if account_data.coll_amount != col_amount {
            return err!(BankError::InvalidRepayment);
        }

        if ctx.accounts.program_loan_wallet.owner != ctx.program_id {
            return err!(BankError::InvalidAccount);
        }

        let token_program = &ctx.accounts.token_program;

        let user = &ctx.accounts.signer;

        let user_col_ata = &ctx.accounts.user_col_ata;
        let program_col_ata = &ctx.accounts.program_col_ata;

        let user_loan_ata = &ctx.accounts.user_loan_ata;
        let program_loan_ata = &ctx.accounts.program_loan_ata;

        if ctx.accounts.program_loan_wallet.key().to_string()
            != program_loan_ata.owner.key().to_string()
        {
            return err!(BankError::InvalidAccount);
        }
        let user_amount: u64 = ctx.accounts.user_loan_ata.amount;
        if user_amount < loan_amount {
            return err!(BankError::InsufficientBalance);
        }

        //Transfer bank from user
        let cpi_accounts = SplTransfer {
            from: user_loan_ata.to_account_info().clone(),
            to: program_loan_ata.to_account_info().clone(),
            authority: user.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), loan_amount)?;

        //Transfer user from bank
        let bump_vector = bump.to_le_bytes();
        let inner = vec![b"collateral".as_ref(), bump_vector.as_ref()];
        let outer = vec![inner.as_slice()];

        let transfer_instruction = SplTransfer {
            from: program_col_ata.to_account_info(),
            to: user_col_ata.to_account_info(),
            authority: ctx.accounts.program_col_wallet.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::transfer(cpi_ctx, col_amount)?;

        msg!("Repayment successfully!");

        Ok(())
    }

    //Withdraw bank supply certificate
    pub fn withdraw_supply(
        ctx: Context<WithdrawSupply>,
        days: u64,
        interest_rate: u64,
        bump: u8,
    ) -> Result<()> {
        let account_data = &mut ctx.accounts.supply_certificate;

        let monthly_interest = account_data.amount as f64 * (interest_rate as f64 / 100.0);
        let days_as_float = days as f64;
        let adjusted_interest = (days_as_float / 30.0) * monthly_interest;
        let adjusted_interest = adjusted_interest as u64;
        let amount = account_data.amount + adjusted_interest;

        msg!("amount: {}", amount);

        let user_ata = &ctx.accounts.user_ata;
        let program_ata = &ctx.accounts.program_ata;

        if account_data.account_type != "SUPPLY".to_string() {
            return err!(BankError::InvalidSupply);
        }

        let program_amount: u64 = ctx.accounts.program_ata.amount;
        msg!("Program balance {}", program_amount);
        if program_amount < amount {
            return err!(BankError::InsufficientBankBalance);
        }

        let bump_vector = bump.to_le_bytes();
        let inner = vec![b"wallet".as_ref(), bump_vector.as_ref()];
        let outer = vec![inner.as_slice()];

        let transfer_instruction = SplTransfer {
            from: program_ata.to_account_info(),
            to: user_ata.to_account_info(),
            authority: ctx.accounts.program_wallet.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        msg!("Supply has been withdraw");
        Ok(())
    }

    //Update interest rate
    pub fn update_interest_rate(ctx: Context<UpdateInterestRate>, interest_rate: u8) -> Result<()> {
        let account_data = &mut ctx.accounts.borrow_certificate;
        account_data.interest_rate = interest_rate;
        msg!("Interest updated successfully!");
        Ok(())
    }

}

#[derive(Accounts)]
pub struct CreateBankWallet<'info> {
    #[account(init, payer = signer, seeds=[b"collateral".as_ref()], bump, space = 8 + WalletAccount::INIT_SPACE)]
    pub program_wallet: Account<'info, WalletAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct WalletAccount {}

#[account]
pub struct NewAccount {
    data: u64,
}

#[derive(Accounts)]
pub struct CreateTokenAccount<'info> {
    #[account(
        init,
        seeds = [mint.key().as_ref(), program_wallet.key().as_ref()],
        bump,
        payer = signer,
        token::mint = mint,
        token::authority = program_wallet,
     )]
    pub program_token_account: Account<'info, TokenAccount>,
    pub program_wallet: Account<'info, WalletAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(rkey: String, amount: u64)]
pub struct AddSupply<'info> {
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_ata: Account<'info, TokenAccount>,

    #[account(init, payer = signer, seeds=[b"supply".as_ref(), signer.key().as_ref(), mint.key().as_ref(), rkey.as_ref()], bump, space = 8 + SupplyAccount::INIT_SPACE,)]
    pub supply_certificate: Account<'info, SupplyAccount>,
    pub mint: Account<'info, Mint>,
    pub program_wallet: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct SupplyAccount {
    #[max_len(32)]
    pub account_type: String,
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub timestamp: u64,
}

#[derive(Accounts)]
#[instruction(rkey: String, amount: u64)]
pub struct BorrowAmount<'info> {
    #[account(mut)]
    pub user_col_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_col_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_loan_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_loan_ata: Account<'info, TokenAccount>,

    #[account(init, payer = signer, seeds=[b"loan".as_ref(), signer.key().as_ref(), mint.key().as_ref(), rkey.as_ref()], bump, space = 8 + BorrowAccount::INIT_SPACE,)]
    pub borrow_certificate: Account<'info, BorrowAccount>,
    pub mint: Account<'info, Mint>,
    pub col_mint: Account<'info, Mint>,
    pub program_loan_wallet: AccountInfo<'info>,
    pub program_col_wallet: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct BorrowAccount {
    #[max_len(32)]
    pub account_type: String,
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub timestamp: u64,
    pub coll_mint: Pubkey,
    pub coll_amount: u64,
    pub status: u8,
    pub interest_rate: u8,
}

#[derive(Accounts)]
pub struct RepaymentAmount<'info> {
    #[account(mut)]
    pub user_col_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_col_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_loan_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_loan_ata: Account<'info, TokenAccount>,

    #[account(mut, close = admin_wallet)]
    pub borrow_certificate: Account<'info, BorrowAccount>,
    pub mint: Account<'info, Mint>,
    pub col_mint: Account<'info, Mint>,
    pub program_loan_wallet: AccountInfo<'info>,
    pub program_col_wallet: AccountInfo<'info>,
    #[account(mut)]
    pub admin_wallet: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawSupply<'info> {
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_ata: Account<'info, TokenAccount>,

    #[account(mut, close = admin_wallet)]
    pub supply_certificate: Account<'info, SupplyAccount>,
    pub mint: Account<'info, Mint>,
    pub program_wallet: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub admin_wallet: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateInterestRate<'info> {
    #[account(mut)]
    pub borrow_certificate: Account<'info, BorrowAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
//Error messages
#[error_code]
pub enum BankError {
    #[msg("INVALID_SUPPLY: Invalid account")]
    InvalidSupply,
    #[msg("INVALID_REPAYMENT: Invalid amount")]
    InvalidRepayment,
    #[msg("INVALID_COLLATERAL: Collateral is invalid")]
    InvalidCollateral,
    #[msg("INVALID_ACCOUNT: Account not belongs to program")]
    InvalidAccount,
    #[msg("INVALID_INSUFFICIENT_BALANCE: Users doesn't have enough balance")]
    InsufficientBalance,
    #[msg("INSUFFICIENT_BALANCE: Pool doesn't have enough balance")]
    InsufficientBankBalance,
}
