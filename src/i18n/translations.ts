export type Language = 'en' | 'km';

export type TranslationKeys =
  // Navbar
  | 'app_name'
  // BottomNav
  | 'nav_portfolio'
  | 'nav_trade'
  | 'nav_prices'
  | 'nav_ledger'
  // Dashboard
  | 'dashboard_title'
  | 'dashboard_subtitle'
  | 'total_portfolio_value'
  | 'assets'
  | 'asset'
  | 'net_all_time_pnl'
  | 'invested'
  | 'unrealized_pnl'
  | 'open_positions'
  | 'realized_pnl'
  | 'locked_in_gains'
  | 'active_holdings'
  | 'no_open_holdings'
  | 'no_holdings_desc'
  | 'add_first_trade'
  | 'update_all_prices'
  | 'open_positions_currency'
  // Add Trade
  | 'record_trade'
  | 'record_trade_subtitle'
  | 'ticker_symbol'
  | 'ticker_placeholder'
  | 'currency'
  | 'quantity'
  | 'price_per_share'
  | 'commission_fee'
  | 'fee_type_amount'
  | 'fee_type_percent'
  | 'subtotal'
  | 'fees'
  | 'calculated_fee'
  | 'total_cost_basis'
  | 'net_proceeds'
  | 'submit_buy_order'
  | 'submit_sell_order'
  | 'processing'
  | 'trade_success'
  | 'error_ticker_required'
  | 'error_quantity_zero'
  | 'error_price_zero'
  | 'error_trade_failed'
  // Update Prices
  | 'update_prices_title'
  | 'update_prices_subtitle'
  | 'no_active_positions'
  | 'cost'
  | 'save'
  // History
  | 'ledger_title'
  | 'ledger_subtitle'
  | 'no_transactions'
  | 'fee_label'
  | 'cost_label'
  | 'pnl_label'
  | 'shares'
  // Auth
  | 'login'
  | 'create_account'
  | 'email'
  | 'password'
  | 'sign_in'
  | 'sign_up'
  | 'please_wait'
  | 'auth_subtitle'
  | 'auth_failed'
  // HoldingCard
  | 'avg'
  | 'now'
  | 'update_price_arrow'
  // History Actions (Edit / Delete)
  | 'edit'
  | 'delete'
  | 'confirmDelete'
  | 'save_changes'
  | 'cancel'
  | 'edit_transaction'
  | 'date'
  | 'saving'
  // Wallet / Cash Management
  | 'nav_wallet'
  | 'wallet_title'
  | 'wallet_subtitle'
  | 'available_cash'
  | 'total_net_worth'
  | 'invested_value'
  | 'deposit'
  | 'withdraw'
  | 'deposit_cash'
  | 'withdraw_cash'
  | 'amount'
  | 'insufficient_cash_warning'
  | 'cash_history'
  | 'funding_history'
  | 'no_cash_transactions'
  | 'no_cash_transactions_yet'
  | 'select_date'
  | 'confirm_delete_cash'
  | 'edit_cash_transaction'
  | 'delete_transaction'
  | 'action'
  | 'edit_success'
  | 'trade_date'
  | 'quick_select'
  | 'total_deposited'
  | 'total_invested'
  | 'total_withdrawn'
  | 'cash_utilization'
  | 'all_time_net_pnl'
  | 'roi'
  | 'return_on_investment'
  | 'performance_insights'
  | 'top_gainer'
  | 'biggest_loser'
  | 'dividend'
  | 'dividend_amount'
  | 'record_dividend'
  | 'error_dividend_zero'
  | 'asset_allocation'
  | 'no_allocation_data'
  | 'export_csv'
  | 'export'
  // Smart Analysis
  | 'smart_analysis'
  | 'dollar_cost_averaging'
  | 'shares_to_buy'
  | 'new_average_price'
  | 'capital_required'
  | 'take_profit_scenarios'
  | 'sell_25'
  | 'sell_50'
  | 'sell_75'
  | 'sell_100'
  | 'locked_in_profit'
  | 'current_avg_price'
  | 'current_market_price'
  | 'shares_owned'
  | 'break_even_point'
  | 'remaining_shares'
  | 'cash_proceeds'
  | 'dca_calculator'
  | 'take_profit_analyzer'
  | 'simulated_shares'
  | 'avg_price_reduction'
  | 'in_loss_dca_hint'
  | 'in_profit_tp_hint'
  | 'execute_trade'
  // Financial Goal Tracker & Dividend Dashboard
  | 'nav_dividends'
  | 'financial_goal'
  | 'set_target_net_worth'
  | 'target_net_worth'
  | 'achieved'
  | 'dividend_dashboard'
  | 'dividend_dashboard_subtitle'
  | 'total_dividends'
  | 'total_dividends_received'
  | 'dividend_yield'
  | 'passive_income'
  | 'edit_goal'
  | 'remaining_to_goal'
  | 'no_dividends_yet'
  | 'no_dividends_desc'
  | 'top_dividend_payer'
  | 'dividend_events'
  | 'save_goal'
  // Financial Goal Forecasting
  | 'estimated_time_to_goal'
  | 'years'
  | 'year'
  | 'months'
  | 'month'
  | 'and'
  | 'increase_deposits_to_forecast'
  | 'based_on_savings_and_roi'
  | 'forecast_info_tooltip'
  // Biometric / PIN App Lock
  | 'app_locked'
  | 'authenticate_to_unlock'
  | 'enable_app_lock'
  | 'set_pin'
  | 'enter_pin'
  | 'use_biometrics'
  | 'incorrect_pin'
  | 'lock_now'
  | 'security_settings'
  | 'biometric_pin_lock'
  | 'biometric_pin_desc'
  | 'pin_saved_success'
  | 'pin_four_digits_required'
  | 'unlock'
  | 'forgot_pin'
  | 'logout_to_reset';

export const translations: Record<Language, Record<TranslationKeys, string>> = {
  en: {
    // Navbar
    app_name: 'StockFolio',
    // BottomNav
    nav_portfolio: 'Portfolio',
    nav_trade: 'Trade',
    nav_prices: 'Prices',
    nav_ledger: 'Ledger',
    // Dashboard
    dashboard_title: 'Dashboard',
    dashboard_subtitle: 'Portfolio performance & holdings',
    total_portfolio_value: 'Total Portfolio Value',
    assets: 'Assets',
    asset: 'Asset',
    net_all_time_pnl: 'Net All-Time P&L',
    invested: 'Invested',
    unrealized_pnl: 'Unrealized P&L',
    open_positions: 'Open positions',
    realized_pnl: 'Realized P&L',
    locked_in_gains: 'Locked-in gains',
    active_holdings: 'Active Holdings',
    no_open_holdings: 'No Open Holdings',
    no_holdings_desc: 'Add your first trade using the button below to start tracking your portfolio.',
    add_first_trade: 'Add First Trade',
    update_all_prices: 'Update All Prices',
    open_positions_currency: 'Open positions',
    // Add Trade
    record_trade: 'Record Trade',
    record_trade_subtitle: 'Manual trade execution with atomic average cost updates',
    ticker_symbol: 'Ticker Symbol',
    ticker_placeholder: 'e.g. AAPL, NVDA, TSLA',
    currency: 'Currency',
    quantity: 'Quantity',
    price_per_share: 'Price / Share',
    commission_fee: 'Commission Fee',
    fee_type_amount: 'Amount',
    fee_type_percent: '% Rate',
    subtotal: 'Subtotal',
    fees: 'Fees',
    calculated_fee: 'Calculated Fee',
    total_cost_basis: 'Total Cost Basis',
    net_proceeds: 'Net Proceeds',
    submit_buy_order: 'Submit BUY Order',
    submit_sell_order: 'Submit SELL Order',
    processing: 'Processing...',
    trade_success: 'Trade recorded successfully! Updating portfolio...',
    error_ticker_required: 'Please provide a ticker symbol.',
    error_quantity_zero: 'Quantity must be greater than zero.',
    error_price_zero: 'Price per share must be greater than zero.',
    error_trade_failed: 'Failed to submit trade.',
    // Update Prices
    update_prices_title: 'Update Market Prices',
    update_prices_subtitle: 'Enter latest market quotes to refresh unrealized profit in real time',
    no_active_positions: 'No active positions to update.',
    cost: 'Cost',
    save: 'Save',
    // History
    ledger_title: 'Trade Ledger',
    ledger_subtitle: 'All executed buy and sell entries',
    no_transactions: 'No transactions recorded yet.',
    fee_label: 'Fee',
    cost_label: 'Cost',
    pnl_label: 'P&L',
    shares: 'shares',
    // Auth
    login: 'Log In',
    create_account: 'Create Account',
    email: 'Email',
    password: 'Password',
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    please_wait: 'Please wait...',
    auth_subtitle: 'Private manual stock tracking on iOS',
    auth_failed: 'Authentication failed. Please check credentials.',
    // HoldingCard
    avg: 'Avg',
    now: 'Now',
    update_price_arrow: 'Update Price →',
    // History Actions (Edit / Delete)
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this transaction?',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    edit_transaction: 'Edit Transaction',
    date: 'Date',
    saving: 'Saving...',
    // Wallet / Cash Management
    nav_wallet: 'Wallet',
    wallet_title: 'Cash Wallet',
    wallet_subtitle: 'Manage your available cash balance',
    available_cash: 'Available Cash',
    total_net_worth: 'Total Net Worth',
    invested_value: 'Invested Value',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    deposit_cash: 'Deposit Cash',
    withdraw_cash: 'Withdraw Cash',
    amount: 'Amount',
    insufficient_cash_warning: 'Warning: Withdrawal amount exceeds available cash balance.',
    cash_history: 'Funding History',
    funding_history: 'Funding History',
    no_cash_transactions: 'No cash deposits or withdrawals recorded yet.',
    no_cash_transactions_yet: 'No cash transactions yet',
    select_date: 'Select Date',
    confirm_delete_cash: 'Are you sure you want to delete this cash transaction?',
    edit_cash_transaction: 'Edit Cash Transaction',
    delete_transaction: 'Delete Transaction',
    action: 'Action',
    edit_success: 'Transaction updated successfully!',
    trade_date: 'Trade Date',
    quick_select: 'Quick Select:',
    total_deposited: 'Total Deposited',
    total_invested: 'Total Invested',
    total_withdrawn: 'Total Withdrawn',
    cash_utilization: 'Cash Utilization',
    all_time_net_pnl: 'All-Time Net P&L',
    roi: 'ROI',
    return_on_investment: 'Return on Investment (ROI)',
    performance_insights: 'Performance Insights',
    top_gainer: 'Top Gainer',
    biggest_loser: 'Biggest Loser',
    dividend: 'Dividend',
    dividend_amount: 'Dividend Amount',
    record_dividend: 'Record Dividend',
    error_dividend_zero: 'Dividend amount must be greater than zero.',
    asset_allocation: 'Asset Allocation',
    no_allocation_data: 'No asset data available to chart',
    export_csv: 'Export CSV',
    export: 'Export',
    // Smart Analysis
    smart_analysis: 'Smart Analysis',
    dollar_cost_averaging: 'Dollar Cost Averaging (DCA)',
    shares_to_buy: 'Shares to Buy',
    new_average_price: 'New Average Price',
    capital_required: 'Capital Required',
    take_profit_scenarios: 'Take Profit Scenarios',
    sell_25: 'Sell 25%',
    sell_50: 'Sell 50%',
    sell_75: 'Sell 75%',
    sell_100: 'Sell 100%',
    locked_in_profit: 'Locked-in Profit',
    current_avg_price: 'Current Avg Price',
    current_market_price: 'Current Market Price',
    shares_owned: 'Shares Owned',
    break_even_point: 'Break-Even Point',
    remaining_shares: 'Remaining Shares',
    cash_proceeds: 'Cash Proceeds',
    dca_calculator: 'DCA Calculator',
    take_profit_analyzer: 'Take Profit Analyzer',
    simulated_shares: 'Simulated Shares to Buy',
    avg_price_reduction: 'Cost Basis Reduction',
    in_loss_dca_hint: 'Position is at a loss. Use DCA to lower your break-even point.',
    in_profit_tp_hint: 'Position is in profit. Compare scenarios to lock in gains.',
    execute_trade: 'Trade Stock',
    // Financial Goal Tracker & Dividend Dashboard
    nav_dividends: 'Dividends',
    financial_goal: 'Financial Goal',
    set_target_net_worth: 'Set Target Net Worth',
    target_net_worth: 'Target Net Worth',
    achieved: 'Achieved',
    dividend_dashboard: 'Dividend Dashboard',
    dividend_dashboard_subtitle: 'Passive income & payout history',
    total_dividends: 'Total Dividends',
    total_dividends_received: 'Total Dividends Received',
    dividend_yield: 'Dividend Yield',
    passive_income: 'Passive Income',
    edit_goal: 'Edit Goal',
    remaining_to_goal: 'Remaining to Goal',
    no_dividends_yet: 'No dividends recorded yet',
    no_dividends_desc: 'Record dividend transactions to track your passive income streams here.',
    top_dividend_payer: 'Top Dividend Payer',
    dividend_events: 'Payout Events',
    save_goal: 'Save Goal',
    // Financial Goal Forecasting
    estimated_time_to_goal: 'Estimated time to goal:',
    years: 'Years',
    year: 'Year',
    months: 'Months',
    month: 'Month',
    and: 'and',
    increase_deposits_to_forecast: 'Increase deposits to forecast',
    based_on_savings_and_roi: 'based on your current savings rate and ROI',
    forecast_info_tooltip: 'Forecast calculated using compound interest (TVM) based on your average monthly deposits and portfolio return.',
    // Biometric / PIN App Lock
    app_locked: 'App Locked',
    authenticate_to_unlock: 'Authenticate to view your portfolio',
    enable_app_lock: 'Enable App Lock',
    set_pin: 'Set 4-Digit PIN',
    enter_pin: 'Enter 4-Digit PIN',
    use_biometrics: 'Use FaceID / TouchID',
    incorrect_pin: 'Incorrect PIN. Please try again.',
    lock_now: 'Lock Now',
    security_settings: 'Security Settings',
    biometric_pin_lock: 'Biometric / PIN App Lock',
    biometric_pin_desc: 'Protect your financial portfolio with FaceID, TouchID, or PIN',
    pin_saved_success: 'PIN saved successfully!',
    pin_four_digits_required: 'PIN must be exactly 4 digits.',
    unlock: 'Unlock',
    forgot_pin: 'Forgot PIN?',
    logout_to_reset: 'Log out to reset',
  },

  km: {
    // Navbar
    app_name: 'StockFolio',
    // BottomNav
    nav_portfolio: 'ផលប័ត្រ',
    nav_trade: 'ជួញដូរ',
    nav_prices: 'តម្លៃ',
    nav_ledger: 'កំណត់ត្រា',
    // Dashboard
    dashboard_title: 'ផ្ទាំងព័ត៌មាន',
    dashboard_subtitle: 'ស្ថានភាពផលប័ត្រ និងទ្រព្យសកម្ម',
    total_portfolio_value: 'តម្លៃសរុបផលប័ត្រ',
    assets: 'ទ្រព្យ',
    asset: 'ទ្រព្យ',
    net_all_time_pnl: 'ចំណេញ/ខាត សុទ្ធ',
    invested: 'វិនិយោគ',
    unrealized_pnl: 'ចំណេញ/ខាត មិនទាន់ដោះ',
    open_positions: 'មុខតំណែងបើកចំហ',
    realized_pnl: 'ចំណេញ/ខាត ដែលបានដោះ',
    locked_in_gains: 'ចំណេញដែលបានទទួល',
    active_holdings: 'ការកាន់កាប់សកម្ម',
    no_open_holdings: 'គ្មានការកាន់កាប់',
    no_holdings_desc: 'បន្ថែមការជួញដូរដំបូងដើម្បីចាប់ផ្តើមតាមដានផលប័ត្ររបស់អ្នក។',
    add_first_trade: 'បន្ថែមការជួញដូរដំបូង',
    update_all_prices: 'ធ្វើបច្ចុប្បន្នភាពតម្លៃទាំងអស់',
    open_positions_currency: 'មុខតំណែងបើកចំហ',
    // Add Trade
    record_trade: 'កត់ត្រាការជួញដូរ',
    record_trade_subtitle: 'ការប្រតិបត្តិការជួញដូរដោយដៃ',
    ticker_symbol: 'និមិត្តសញ្ញា',
    ticker_placeholder: 'ឧ. AAPL, NVDA, TSLA',
    currency: 'រូបិយប័ណ្ណ',
    quantity: 'បរិមាណ',
    price_per_share: 'តម្លៃ / ហ៊ុន',
    commission_fee: 'កម្រៃជើងសា',
    fee_type_amount: 'ចំនួន',
    fee_type_percent: 'ភាគរយ %',
    subtotal: 'សរុបរង',
    fees: 'កម្រៃ',
    calculated_fee: 'កម្រៃដែលបានគណនា',
    total_cost_basis: 'ថ្លៃដើមសរុប',
    net_proceeds: 'ចំណូលសុទ្ធ',
    submit_buy_order: 'ដាក់ការបញ្ជាទិញ',
    submit_sell_order: 'ដាក់ការបញ្ជាលក់',
    processing: 'កំពុងដំណើរការ...',
    trade_success: 'ការជួញដូរបានកត់ត្រា! កំពុងធ្វើបច្ចុប្បន្នភាព...',
    error_ticker_required: 'សូមផ្តល់និមិត្តសញ្ញាហ៊ុន។',
    error_quantity_zero: 'បរិមាណត្រូវតែធំជាងសូន្យ។',
    error_price_zero: 'តម្លៃក្នុងមួយហ៊ុនត្រូវតែធំជាងសូន្យ។',
    error_trade_failed: 'មិនអាចដាក់ការជួញដូរបាន។',
    // Update Prices
    update_prices_title: 'ធ្វើបច្ចុប្បន្នភាពតម្លៃទីផ្សារ',
    update_prices_subtitle: 'បញ្ចូលតម្លៃទីផ្សារថ្មីដើម្បីធ្វើបច្ចុប្បន្នភាពការចំណេញ',
    no_active_positions: 'គ្មានមុខតំណែងសកម្មដើម្បីធ្វើបច្ចុប្បន្នភាព។',
    cost: 'ថ្លៃដើម',
    save: 'រក្សាទុក',
    // History
    ledger_title: 'ប្រវត្តិជួញដូរ',
    ledger_subtitle: 'ការទិញ និងការលក់ទាំងអស់',
    no_transactions: 'មិនទាន់មានប្រតិបត្តិការ។',
    fee_label: 'កម្រៃ',
    cost_label: 'ថ្លៃដើម',
    pnl_label: 'ចំណេញ/ខាត',
    shares: 'ហ៊ុន',
    // Auth
    login: 'ចូលប្រើ',
    create_account: 'បង្កើតគណនី',
    email: 'អ៊ីមែល',
    password: 'ពាក្យសម្ងាត់',
    sign_in: 'ចូល',
    sign_up: 'ចុះឈ្មោះ',
    please_wait: 'សូមរង់ចាំ...',
    auth_subtitle: 'ការតាមដានហ៊ុនដោយដៃ',
    auth_failed: 'ការផ្ទៀងផ្ទាត់ខុស។ សូមពិនិត្យព័ត៌មានប្រើប្រាស់ម្តងទៀត។',
    // HoldingCard
    avg: 'មធ្យម',
    now: 'ឥឡូវ',
    update_price_arrow: 'ធ្វើបច្ចុប្បន្នភាព →',
    // History Actions (Edit / Delete)
    edit: 'កែប្រែ',
    delete: 'លុប',
    confirmDelete: 'តើអ្នកប្រាកដថាចង់លុបប្រតិបត្តិការនេះមែនទេ?',
    save_changes: 'រក្សាទុកការផ្លាស់ប្តូរ',
    cancel: 'បោះបង់',
    edit_transaction: 'កែប្រែប្រតិបត្តិការ',
    date: 'កាលបរិច្ឆេទ',
    saving: 'កំពុងរក្សាទុក...',
    // Wallet / Cash Management
    nav_wallet: 'កាបូបលុយ',
    wallet_title: 'កាបូបសាច់ប្រាក់',
    wallet_subtitle: 'គ្រប់គ្រងសមតុល្យសាច់ប្រាក់របស់អ្នក',
    available_cash: 'សាច់ប្រាក់ដែលមាន',
    total_net_worth: 'ទ្រព្យសម្បត្តិសុទ្ធសរុប',
    invested_value: 'តម្លៃវិនិយោគ',
    deposit: 'ដាក់ប្រាក់',
    withdraw: 'ដកប្រាក់',
    deposit_cash: 'ដាក់សាច់ប្រាក់',
    withdraw_cash: 'ដកសាច់ប្រាក់',
    amount: 'ចំនួនទឹកប្រាក់',
    insufficient_cash_warning: 'ការព្រមាន៖ ចំនួនដកប្រាក់លើសពីសមតុល្យសាច់ប្រាក់ដែលមាន។',
    cash_history: 'ប្រវត្តិសាច់ប្រាក់',
    funding_history: 'ប្រវត្តិសាច់ប្រាក់',
    no_cash_transactions: 'មិនទាន់មានការដាក់ ឬដកប្រាក់នៅឡើយទេ។',
    no_cash_transactions_yet: 'មិនទាន់មានប្រតិបត្តិការសាច់ប្រាក់នៅឡើយទេ',
    select_date: 'ជ្រើសរើសកាលបរិច្ឆេទ',
    confirm_delete_cash: 'តើអ្នកប្រាកដថាចង់លុបប្រតិបត្តិការសាច់ប្រាក់នេះមែនទេ?',
    edit_cash_transaction: 'កែប្រែប្រតិបត្តិការសាច់ប្រាក់',
    delete_transaction: 'លុបប្រតិបត្តិការ',
    action: 'សកម្មភាព',
    edit_success: 'បានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!',
    trade_date: 'កាលបរិច្ឆេទជួញដូរ',
    quick_select: 'ជ្រើសរើសរហ័ស៖',
    total_deposited: 'ប្រាក់ដាក់សរុប',
    total_invested: 'ប្រាក់វិនិយោគសរុប',
    total_withdrawn: 'ប្រាក់ដកសរុប',
    cash_utilization: 'ការបែងចែកសាច់ប្រាក់',
    all_time_net_pnl: 'ចំណេញ/ខាត សរុបគ្រប់ពេល',
    roi: 'ROI',
    return_on_investment: 'ផលចំណេញពីការវិនិយោគ (ROI)',
    performance_insights: 'ការវិភាគដំណើរការ',
    top_gainer: 'ចំណេញច្រើនជាងគេ',
    biggest_loser: 'ខាតច្រើនជាងគេ',
    dividend: 'ភាគលាភ',
    dividend_amount: 'ចំនួនទឹកប្រាក់ភាគលាភ',
    record_dividend: 'កត់ត្រាភាគលាភ',
    error_dividend_zero: 'ចំនួនភាគលាភត្រូវតែធំជាងសូន្យ។',
    asset_allocation: 'ការបែងចែកទ្រព្យសកម្ម',
    no_allocation_data: 'មិនមានទិន្នន័យទ្រព្យសកម្មសម្រាប់គូរតារាងទេ',
    export_csv: 'ទាញយក CSV',
    export: 'ទាញយក',
    // Smart Analysis
    smart_analysis: 'ការវិភាគឆ្លាតវៃ',
    dollar_cost_averaging: 'យុទ្ធសាស្ត្រទិញមធ្យមភាគ (DCA)',
    shares_to_buy: 'ចំនួនហ៊ុនត្រូវទិញបន្ថែម',
    new_average_price: 'ថ្លៃដើមមធ្យមថ្មី',
    capital_required: 'ដើមទុនបន្ថែមដែលត្រូវការ',
    take_profit_scenarios: 'សេណារីយ៉ូកាត់យកប្រាក់ចំណេញ',
    sell_25: 'លក់ ២៥%',
    sell_50: 'លក់ ៥០%',
    sell_75: 'លក់ ៧៥%',
    sell_100: 'លក់ ១០០%',
    locked_in_profit: 'ប្រាក់ចំណេញទទួលបាន',
    current_avg_price: 'ថ្លៃដើមមធ្យមបច្ចុប្បន្ន',
    current_market_price: 'តម្លៃទីផ្សារបច្ចុប្បន្ន',
    shares_owned: 'ចំនួនភាគហ៊ុនដែលមាន',
    break_even_point: 'ចំណុចរួចដើម',
    remaining_shares: 'ភាគហ៊ុននៅសល់',
    cash_proceeds: 'សាច់ប្រាក់ទទួលបាន',
    dca_calculator: 'ម៉ាស៊ីនគិតលេខ DCA',
    take_profit_analyzer: 'ការវិភាគកាត់យកចំណេញ',
    simulated_shares: 'ចំនួនហ៊ុនសាកល្បងទិញបន្ថែម',
    avg_price_reduction: 'ការបញ្ចុះថ្លៃដើមមធ្យម',
    in_loss_dca_hint: 'ភាគហ៊ុននេះកំពុងខាត។ ប្រើ DCA ដើម្បីបន្ថយថ្លៃដើមមធ្យម និងចំណុចរួចដើមរបស់អ្នក។',
    in_profit_tp_hint: 'ភាគហ៊ុននេះកំពុងមានចំណេញ។ ពិនិត្យមើលសេណារីយ៉ូដើម្បីកាត់យកប្រាក់ចំណេញ។',
    execute_trade: 'ទៅកាន់ការជួញដូរ',
    // Financial Goal Tracker & Dividend Dashboard
    nav_dividends: 'ភាគលាភ',
    financial_goal: 'គោលដៅហិរញ្ញវត្ថុ',
    set_target_net_worth: 'កំណត់ទ្រព្យសម្បត្តិសុទ្ធគោលដៅ',
    target_net_worth: 'ទ្រព្យសម្បត្តិសុទ្ធគោលដៅ',
    achieved: 'សម្រេចបាន',
    dividend_dashboard: 'ផ្ទាំងតាមដានភាគលាភ',
    dividend_dashboard_subtitle: 'ចំណូលអកម្ម និងប្រវត្តិទទួលបានភាគលាភ',
    total_dividends: 'ភាគលាភសរុប',
    total_dividends_received: 'ភាគលាភសរុបទទួលបាន',
    dividend_yield: 'អត្រាភាគលាភ (Yield)',
    passive_income: 'ចំណូលអកម្ម',
    edit_goal: 'កែប្រែគោលដៅ',
    remaining_to_goal: 'នៅខ្វះដើម្បីសម្រេចគោលដៅ',
    no_dividends_yet: 'មិនទាន់មានភាគលាភនៅឡើយទេ',
    no_dividends_desc: 'កត់ត្រាប្រតិបត្តិការភាគលាភដើម្បីតាមដានចំណូលអកម្មរបស់អ្នកនៅទីនេះ។',
    top_dividend_payer: 'ភាគហ៊ុនផ្តល់ភាគលាភច្រើនជាងគេ',
    dividend_events: 'ចំនួនលើកទទួលបាន',
    save_goal: 'រក្សាទុកគោលដៅ',
    // Financial Goal Forecasting
    estimated_time_to_goal: 'រយៈពេលប៉ាន់ស្មានដើម្បីសម្រេចគោលដៅ៖',
    years: 'ឆ្នាំ',
    year: 'ឆ្នាំ',
    months: 'ខែ',
    month: 'ខែ',
    and: 'និង',
    increase_deposits_to_forecast: 'សូមបង្កើនការដាក់ប្រាក់ដើម្បីប៉ាន់ស្មាន',
    based_on_savings_and_roi: 'ផ្អែកលើអត្រាសន្សំ និង ROI បច្ចុប្បន្ន',
    forecast_info_tooltip: 'ការព្យាករណ៍គណនាតាមការប្រាក់សមាស (TVM) ផ្អែកលើការដាក់ប្រាក់ប្រចាំខែ និងផលចំណេញផលប័ត្ររបស់អ្នក។',
    // Biometric / PIN App Lock
    app_locked: 'កម្មវិធីត្រូវបានចាក់សោ',
    authenticate_to_unlock: 'សូមផ្ទៀងផ្ទាត់ដើម្បីមើលផលប័ត្ររបស់អ្នក',
    enable_app_lock: 'បើកការចាក់សោកម្មវិធី',
    set_pin: 'កំណត់លេខកូដសម្ងាត់ ៤ ខ្ទង់',
    enter_pin: 'បញ្ចូលលេខកូដសម្ងាត់ ៤ ខ្ទង់',
    use_biometrics: 'ប្រើ FaceID / TouchID',
    incorrect_pin: 'លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្តងទៀត។',
    lock_now: 'ចាក់សោឥឡូវនេះ',
    security_settings: 'ការកំណត់សុវត្ថិភាព',
    biometric_pin_lock: 'ចាក់សោដោយជីវមាត្រ / លេខកូដ PIN',
    biometric_pin_desc: 'ការពារផលប័ត្រហិរញ្ញវត្ថុរបស់អ្នកដោយប្រើ FaceID, TouchID ឬ PIN',
    pin_saved_success: 'បានរក្សាទុកលេខកូដ PIN ដោយជោគជ័យ!',
    pin_four_digits_required: 'លេខកូដ PIN ត្រូវតែមាន ៤ ខ្ទង់។',
    unlock: 'ដោះសោ',
    forgot_pin: 'ភ្លេចលេខកូដ PIN?',
    logout_to_reset: 'ចាកចេញដើម្បីកំណត់ឡើងវិញ',
  },
};
