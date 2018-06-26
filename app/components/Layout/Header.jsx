import React from "react";
import {Link} from "react-router/es";
import { connect } from "alt-react";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import WalletDb from "stores/WalletDb";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletManagerStore from "stores/WalletManagerStore";
import cnames from "classnames";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import ReactTooltip from "react-tooltip";
import { Apis } from "bitsharesjs-ws";
import notify from "actions/NotificationActions";
import IntlActions from "actions/IntlActions";
import AccountImage from "../Account/AccountImage";

var logo = require("assets/logo.png");

const FlagImage = ({flag, width = 20, height = 20}) => {
    return <img height={height} width={width} src={`${__BASE_URL__}language-dropdown/${flag.toUpperCase()}.png`} />;
};

class Header extends React.Component {

    static contextTypes = {
        location: React.PropTypes.object.isRequired,
        router: React.PropTypes.object.isRequired
    };

    constructor(props, context) {
        super();
        this.state = {
            active: context.location.pathname
        };

        this.unlisten = null;
    }

    componentWillMount() {
        this.unlisten = this.context.router.listen((newState, err) => {
            if (!err) {
                if (this.unlisten && this.state.active !== newState.pathname) {
                    this.setState({
                        active: newState.pathname
                    });
                }
            }
        });
    }

    componentDidMount() {
        setTimeout(() => {
            ReactTooltip.rebuild();
        }, 1250);
    }

    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten();
            this.unlisten = null;
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket ||
            nextProps.starredAccounts !== this.props.starredAccounts ||
            nextProps.currentLocale !== this.props.currentLocale ||
            nextProps.height !== this.props.height ||
            nextState.active !== this.state.active
        );
    }

    _triggerMenu(e) {
        e.preventDefault();
        ZfApi.publish("mobile-menu", "toggle");
    }

    _toggleLock(e) {
        e.preventDefault();
        if (WalletDb.isLocked()) {
            WalletUnlockActions.unlock().then(() => {
                AccountActions.tryToSetCurrentAccount();
            });
        } else {
            WalletUnlockActions.lock();
        }
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.context.router.push(route);
    }

    _onGoBack(e) {
        e.preventDefault();
        window.history.back();
    }

    _onGoForward(e) {
        e.preventDefault();
        window.history.forward();
    }

    _accountClickHandler(account_name, e) {
        e.preventDefault();
        ZfApi.publish("account_drop_down", "close");
        if (this.context.location.pathname.indexOf("/account/") !== -1) {
            let currentPath = this.context.location.pathname.split("/");
            currentPath[2] = account_name;
            this.context.router.push(currentPath.join("/"));
        }
        if (account_name !== this.props.currentAccount) {
            AccountActions.setCurrentAccount.defer(account_name);
            notify.addNotification({
                message: counterpart.translate("header.account_notify", {account: account_name}),
                level: "success",
                autoDismiss: 2
            });
        }
        // this.onClickUser(account_name, e);
    }

    // onClickUser(account, e) {
    //     e.stopPropagation();
    //     e.preventDefault();
    //
    //     this.context.router.push(`/account/${account}/overview`);
    // }

    render() {
        let {active} = this.state;
        let {currentAccount, starredAccounts, passwordLogin, height} = this.props;
        let locked_tip = counterpart.translate("header.locked_tip");
        let unlocked_tip = counterpart.translate("header.unlocked_tip");

        let tradingAccounts = AccountStore.getMyAccounts();
        let maxHeight = Math.max(40, height - 64 - 36) + "px";
        let overflowY = "auto";

        if (starredAccounts.size) {
            for (let i = tradingAccounts.length - 1; i >= 0; i--) {
                if (!starredAccounts.has(tradingAccounts[i])) {
                    tradingAccounts.splice(i, 1);
                }
            };
            starredAccounts.forEach(account => {
                if (tradingAccounts.indexOf(account.name) === -1) {
                    tradingAccounts.push(account.name);
                }
            });
        }

        const flagDropdown =
            <div style={{float: "right", width: 50, height: 58}} className="right-border">
                <ActionSheet>
                    <ActionSheet.Button title="">
                        <a style={{ border: "none", width: 50, height: 58, paddingTop: 19}} className="no-background button ">
                         <FlagImage flag={this.props.currentLocale} />
                        </a>
                    </ActionSheet.Button>
                    <ActionSheet.Content>
                        <ul className="no-first-element-top-border" style={{ maxHeight, overflowY }}>
                            {this.props.locales.map(locale => {
                                return (
                                    <li key={locale}>
                                        <a href onClick={(e) => {e.preventDefault(); IntlActions.switchLocale(locale);}} >
                                            <div className="table-cell" style={{paddingLeft: 15}}><FlagImage flag={locale} /></div>
                                            <div className="table-cell" style={{paddingLeft: 10}}><Translate content={"languages." + locale} /></div>

                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </ActionSheet.Content>
                </ActionSheet>
            </div>;

        let walletLock = this.props.locked ?
            <a style={{paddingTop: "17px", width: 50}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 0}" data-tip={locked_tip} data-place="bottom" data-html>
                <Icon className="icon-20px" name="locked"/></a>
            : <a style={{paddingTop: "17px", width: 50}} href onClick={this._toggleLock.bind(this)} data-class="unlock-tooltip" data-offset="{'left': 0}" data-tip={unlocked_tip} data-place="bottom" data-html>
                <Icon className="icon-20px" name="unlocked"/></a>;

        let setting = require("assets/settings.png");

        return (
            <div className="header menu-group">
                <div className="menu-bar">
                    <div className="menu-bar-left">
                        {/*<Link to= "/">*/}
                        <img src={logo}/>
                        {/*</Link>*/}
                    </div>
                    <div className="menu-bar-right">
                        {walletLock}
                        {flagDropdown}
                        <Link to={`/settings`} className={cnames("right-border",{active: active.indexOf("settings") !== -1})} style={{width: 60}}>
                            <img src={setting} />
                        </Link>
                        <Link to={`/account/${currentAccount}/operation-history`}
                              className={cnames("right-border",{active: active.indexOf("operation-history") !== -1})}>
                            <Translate content="header.history" />
                        </Link>
                        <Link to={`/transfer`} className={cnames("h-border", {active: active.indexOf("transfer") !== -1})}>
                            <Translate content="header.payments" />
                        </Link>
                        <Link to={`/account/${currentAccount}/dashboard`}
                              className={cnames({active:  active === "/" || (active.indexOf("dashboard") !== -1 )})}>
                            <Translate content="header.account" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(Header, {
    listenTo() {
        return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore];
    },
    getProps() {
        const chainID = Apis.instance().chain_id;
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
            currentAccount: AccountStore.getState().currentAccount || AccountStore.getState().passwordAccount,
            locked: WalletUnlockStore.getState().locked,
            current_wallet: WalletManagerStore.getState().current_wallet,
            lastMarket: SettingsStore.getState().viewSettings.get(`lastMarket${chainID ? ("_" + chainID.substr(0, 8)) : ""}`),
            starredAccounts: AccountStore.getState().starredAccounts,
            passwordLogin: SettingsStore.getState().settings.get("passwordLogin"),
            currentLocale: SettingsStore.getState().settings.get("locale"),
            locales: SettingsStore.getState().defaults.locale
        };
    }
});
