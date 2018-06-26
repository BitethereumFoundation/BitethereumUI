import React from "react";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import {ChainStore, FetchChain} from "bitsharesjs/es";
import AccountLeftPanel from "./AccountLeftPanel";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import { connect } from "alt-react";
import accountUtils from "common/account_utils";
import CreateAccount from "components/Account/CreateAccount";

class AccountPage extends React.Component {

    constructor(props, context) {
        super(props, context);
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    static propTypes = {
       // account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        //account: "props.params.account_name"
    };

    componentDidMount() {
        if (this.props.account && AccountStore.isMyAccount(this.props.account)) {
            AccountActions.setCurrentAccount.defer(this.props.account.get("name"));
        }

        // Fetch possible fee assets here to avoid async issues later (will resolve assets)
        accountUtils.getPossibleFees(this.props.account, "transfer");
    }

    render() {
        let {myAccounts, linkedAccounts, account_name, searchAccounts, settings, wallet_locked, hiddenAssets, account} = this.props;
        let isMyAccount = AccountStore.isMyAccount(account);
        if(!account){return null}
        return (
             <div className="grid-block page-layout">
                    <div className="grid-block main-content">
                        <div className="grid-container">
                        {React.cloneElement(
                            React.Children.only(this.props.children),
                            {
                                account_name,
                                linkedAccounts,
                                searchAccounts,
                                settings,
                                wallet_locked,
                                account,
                                isMyAccount,
                                hiddenAssets,
                                contained: true,
                                balances: account.get("balances", null),
                                orders: account.get("orders", null),
                                backedCoins: this.props.backedCoins,
                                bridgeCoins: this.props.bridgeCoins,
                                gatewayDown: this.props.gatewayDown,
                                viewSettings: this.props.viewSettings,
                                proxy: account.getIn(["options", "voting_account"])
                            }
                        )}
                        </div>
                    </div>
                </div>
            );
        }
}
AccountPage = BindToChainState(AccountPage, {keep_updating: true, show_loader: true});

class AccountPageStoreWrapper extends React.Component {
    render () {
        let account_name = this.props.routeParams.account_name;
        let account = ChainStore.getAccount(account_name); // ? account_name : AccountStore.getState().currentAccount);
        return <AccountPage {...this.props} account_name={account_name} account={account}/>;
    }
}

export default connect(AccountPageStoreWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore, WalletUnlockStore];
    },
    getProps() {
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
            searchAccounts: AccountStore.getState().searchAccounts,
            settings: SettingsStore.getState().settings,
            wallet_locked: WalletUnlockStore.getState().locked,
            myAccounts:  AccountStore.getState().myAccounts,
            viewSettings: SettingsStore.getState().viewSettings,
        };
    }
});
