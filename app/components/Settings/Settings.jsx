import React from "react";
import counterpart from "counterpart";
import IntlActions from "actions/IntlActions";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import WebsocketAddModal from "./WebsocketAddModal";
import { connect } from "alt-react";
import SettingsEntry from "./SettingsEntry";
import AccountsSettings from "./AccountsSettings";
import WalletSettings from "./WalletSettings";
import PasswordSettings from "./PasswordSettings";
import RestoreSettings from "./RestoreSettings";
import BackupSettings from "./BackupSettings";
import AccessSettings from "./AccessSettings";
import AccountStore from "../../stores/AccountStore";
import SettingsStore from "../../stores/SettingsStore";
import WalletUnlockStore from "../../stores/WalletUnlockStore";
import BindToChainState from "../Utility/BindToChainState";
import {ChainStore} from "bitsharesjs/es";
import {BackupCreate} from "../Wallet/Backup";
import AccountVoting from "../../components/Account/AccountVoting";
import Airdrop from "./Airdrop";

class Settings extends React.Component {

    constructor(props) {
        super();

        let menuEntries = this._getMenuEntries(props);
        let activeSetting = props.viewSettings.get("activeSetting", 0);
        if (activeSetting > (menuEntries.length - 1)) {
            activeSetting = 0;
        }
        if (props.deprecated) activeSetting = 1;

        this.state = {
            apiServer: props.settings.get("apiServer"),
            activeSetting,
            menuEntries,
            settingEntries: {
                general: ["locale", "unit", "showSettles", "walletLockTimeout", "themes",
                "showAssetPercent", "passwordLogin", "reset"],
                access: ["apiServer", "faucet_address"]
            }
        };
    }

    componentWillReceiveProps(np) {
        if (np.settings.get("passwordLogin") !== this.props.settings.get("passwordLogin")) {
            const currentEntries = this._getMenuEntries(this.props);
            const menuEntries = this._getMenuEntries(np);
            const currentActive = currentEntries[this.state.activeSetting];
            const newActiveIndex = menuEntries.indexOf(currentActive);
            const newActive = menuEntries[newActiveIndex];
            this.setState({
                menuEntries
            });
            if (newActiveIndex && newActiveIndex !== this.state.activeSetting) {
                this.setState({
                    activeSetting: menuEntries.indexOf(currentActive)
                });
            } else if (!newActive || this.state.activeSetting > (menuEntries.length - 1)) {
                this.setState({
                    activeSetting: 0
                });
            }
        }
    }

    _getMenuEntries(props) {
        if (props.deprecated) {
            return [
                "wallet",
                "backup"
            ];
        }

        // let menuEntries = [
        //     // "general",
        //     // "wallet",
        //     // "accounts",
        //     // "vote",
        //     "backup",
        //     "restore",
        //     "password",
        //     "airdrop"
        //     // "access",
        //     // "faucet_address"
        // ];
        let menuEntries =
            Date.parse(new Date()) < 1522598400000 ?
            [
            "backup",
            "restore",
            "password",
            "airdrop"
            ] : ["backup",
                "restore",
                "password"];
        if (props.settings.get("passwordLogin")) {
            menuEntries.splice(4, 1);
            menuEntries.splice(3, 1);
            menuEntries.splice(1, 1);
        }
        return menuEntries;
    }

    triggerModal(e, ...args) {
        this.refs.ws_modal.show(e, ...args);
    }

    _onChangeSetting(setting, e) {
        e.preventDefault();

        let {defaults} = this.props;
        let value = null;

        function findEntry(targetValue, targetDefaults) {
            if (!targetDefaults) return targetValue;
            if (targetDefaults[0].translate) {
                for (var i = 0; i < targetDefaults.length; i++) {
                    if (counterpart.translate(`settings.${targetDefaults[i].translate}`) === targetValue) {
                        return i;
                    }
                }
            } else {
                return targetDefaults.indexOf(targetValue);
            }
        }

        switch (setting) {
        case "locale":
            let myLocale = counterpart.getLocale();
            if (e.target.value !== myLocale) {
                IntlActions.switchLocale(e.target.value);
                SettingsActions.changeSetting({setting: "locale", value: e.target.value });
            }
            break;

        case "themes":
            SettingsActions.changeSetting({setting: "themes", value: e.target.value });
            break;

        case "defaultMarkets":
            break;

        case "walletLockTimeout":
            let newValue = parseInt(e.target.value, 10);
            if (isNaN(newValue)) newValue = 0;
            if (!isNaN(newValue) && typeof newValue === "number") {
                SettingsActions.changeSetting({setting: "walletLockTimeout", value: newValue });
            }
            break;

        case "inverseMarket":
        case "confirmMarketOrder":
            value = findEntry(e.target.value, defaults[setting]) === 0; // USD/BTS is true, BTS/USD is false
            break;

        case "apiServer":
            SettingsActions.changeSetting({setting: "apiServer", value: e.target.value });
            this.setState({
                apiServer: e.target.value
            });
            break;

        case "showSettles":
        case "showAssetPercent":
        case "passwordLogin":
            let reference = defaults[setting][0];
            if (reference.translate) reference = reference.translate;
            SettingsActions.changeSetting({setting, value: e.target.value === reference });
            break;

        case "unit":
            let index = findEntry(e.target.value, defaults[setting]);
            SettingsActions.changeSetting({setting: setting, value: defaults[setting][index]});
            break;

        default:
            value = findEntry(e.target.value, defaults[setting]);
            break;
        }

        if (value !== null) {
            SettingsActions.changeSetting({setting: setting, value: value });
        }

    }

    onReset() {
        SettingsActions.clearSettings();
    }

    _onChangeMenu(entry) {
        let index = this.state.menuEntries.indexOf(entry);
        this.setState({
            activeSetting: index
        });

        if(entry !== "airdrop") {
            SettingsActions.changeViewSetting({activeSetting: index});
        }
    }

    _onPasswordChange(){
        SettingsActions.changeViewSetting({activeSetting: 0});
        this.setState({activeSetting: 0})
    }

    render() {

        let {settings, defaults} = this.props;
        const {menuEntries, activeSetting, settingEntries} = this.state;
        let entries;
        let activeEntry = menuEntries[activeSetting] || menuEntries[0];
        switch (activeEntry) {

        case "accounts":
            entries = <AccountsSettings account={this.props.account} />;
            break;

        case "wallet":
            entries = <WalletSettings {...this.props} />;
            break;

        case "password":
            entries = <PasswordSettings onSuccess={this._onPasswordChange.bind(this)}/>;
            break;

        case "backup":
            entries = <BackupCreate/>;
            break;

        case "restore":
            entries = <RestoreSettings passwordLogin={this.props.settings.get("passwordLogin")} />;
            break;

        case "access":
            entries = <AccessSettings faucet={settings.get("faucet_address")} nodes={defaults.apiServer} onChange={this._onChangeSetting.bind(this)} triggerModal={this.triggerModal.bind(this)} />;
            break;

        case "faucet_address":
            entries = <input type="text" defaultValue={settings.get("faucet_address")} onChange={this._onChangeSetting.bind(this, "faucet_address")}/>
            break;

        case "vote":
            let proxy = this.props.account.getIn(["options", "voting_account"]);
            entries = <AccountVoting proxy = {proxy} viewSettings={this.props.viewSettings} settings={this.props.settings} account={this.props.account}/>;
            break;

        case "airdrop":
            entries = <Airdrop account={this.props.account}/>;
            break;

        default:
            entries = settingEntries[activeEntry].map(setting => {
                return (
                    <SettingsEntry
                        key={setting}
                        setting={setting}
                        settings={settings}
                        defaults={defaults[setting]}
                        onChange={this._onChangeSetting.bind(this)}
                        locales={this.props.localesObject}
                        {...this.state}
                    />);
            });
            break;
        }

        return (
            <div className={this.props.deprecated ? "" : "grid-block page-layout"} style={{background: "#ffffff"}}>
                <div className="grid-block main-content wrap">
                    <div className="grid-content shrink left-setting-panel">
                        <Translate style={{height: 50, paddingLeft: 30,  width: "100%", display: "inline-block",  lineHeight: "50px",
                            fontSize: 16, color: "#1975d5", background: "#fafafa",  borderBottom: "1px solid #e0e0e0"}}
                                   content="header.settings"/>
                        <div />
                        <ul className="settings-menu" >
                            {menuEntries.map((entry, index) => {
                                return <li className={index === activeSetting ? "active" : ""}
                                           onClick={this._onChangeMenu.bind(this, entry)} key={entry}
                                            style={entry === "vote" ? {borderBottom: "1px solid #e0e0e0"}: null}>
                                    <Translate content={"settings." + entry} />
                                </li>;
                            })}
                        </ul>
                    </div>
                    <div className="grid-content" style={{padding: "0 20px", maxWidth: 642, height:522 }}>
                         <div className="grid-block no-margin vertical">
                             <Translate style={{height: 50, fontSize: 16, color: "#4d4d4d", lineHeight: "50px", width: "100%", borderBottom: "1px solid #d9d9d9"}}
                                        content={"settings." + menuEntries[activeSetting]} />
                             {/*{activeEntry !== "vote" ? <Translate style={{height: 50, fontSize: 16, color: "#4d4d4d", lineHeight: "50px", width: "100%", borderBottom: "1px solid #d9d9d9"}}*/}
                                       {/*content={"settings." + menuEntries[activeSetting]} /> : null}*/}
                            {/*{activeEntry != "access" && <Translate unsafe style={{paddingTop: 10, paddingBottom: 20, marginBottom: 30}} className="bottom-border" content={`settings.${menuEntries[activeSetting]}_text`} />}*/}
                            <div style={{marginTop: 15}}>
                            {entries}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Settings = BindToChainState(Settings, {keep_updating: true, show_loader: true});

class SettingsWrapper extends React.Component {
    render () {
        let account_name = AccountStore.getState().currentAccount;
        let account = ChainStore.getAccount(account_name ? account_name : AccountStore.getState().currentAccount);
        return <Settings {...this.props} account_name={account_name} account={account}/>;
    }
}

export default connect(SettingsWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore, WalletUnlockStore];
    },
    getProps() {
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
            searchAccounts: AccountStore.getState().searchAccounts,
            settings: SettingsStore.getState().settings,
            hiddenAssets: SettingsStore.getState().hiddenAssets,
            wallet_locked: WalletUnlockStore.getState().locked,
            myAccounts:  AccountStore.getState().myAccounts,
            viewSettings: SettingsStore.getState().viewSettings,
        };
    }
});
