import React from "react";
import { connect } from "alt-react";
import classNames from "classnames";
import cnames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import {Link} from "react-router/es";
import AccountSelect from "./Forms/AccountSelect";
import WalletUnlockActions from "actions/WalletUnlockActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "./LoadingIndicator";
import WalletActions from "actions/WalletActions";
import Translate from "react-translate-component";
import {ChainStore, FetchChain, ChainValidation} from "bitsharesjs/es";
import {BackupCreate, BackupRestore} from "./Wallet/Backup";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";


class RegisterAccount extends React.Component {
    constructor() {
        super();
        this.state = {
            accountName: "",
            registrar_account: null,
            loading: false,
            hide_refcode: true,
            show_identicon: false,
            step: 1,
            password: "",
            confirmPassword: "",
            accountNameError: null,
            passwordError: null,
            isValidName: false,
            isValidPassword: false,
            isLoading: false,
            isRegistering: false,
            action: 1 // 1. register account; 2. restore
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.accountNameInput = null;
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    componentWillMount() {
        let currentAccount = AccountStore.getState().currentAccount;
        if(currentAccount){
            this.context.router.push("/account/" + currentAccount + "/overview");
        }
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

    componentWillUpdate(){
        let currentAccount = AccountStore.getState().currentAccount;
        if (currentAccount && this.state.action !== 1) {
            this.context.router.push("/account/" + currentAccount + "/overview");
        }

    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(nextProps, nextState) {

        return !utils.are_equal_shallow(nextState, this.state)
            || nextProps.searchAccounts !== this.props.searchAccounts
            || nextProps.searchTerm !== this.props.searchTerm
            || ( nextProps.currentAccount !== this.props.currentAccount && this.state.isRegistering === false);
    }

    onAccountNameInput(e){
        let accountName = e.target.value.toLowerCase();
        accountName = accountName.match(/[a-z0-9\.-]+/);
        accountName = accountName ? accountName[0] : "";
        AccountActions.accountSearch(accountName);
        let {isValid, error} = this._validateAccountName(accountName);
        this.setState({
            accountName: accountName,
            isValidName: isValid,
            accountNameError: error
        });

    }

    onPasswordInput(e){
        let password = e.target.value;
        let {isValid, error} = this._checkPasswordValidation(password, this.state.confirmPassword);
        this.setState({
            password: e.target.value,
            isValidPassword: isValid,
            passwordError: !this.state.isValidName ? this.state.error : error
        });

    }

    onPasswordConfirm(e){
        let confirmedPassword = e.target.value;
        let {isValid, error} = this._checkPasswordValidation(this.state.password, confirmedPassword);
        this.setState({
            confirmPassword: e.target.value,
            isValidPassword: isValid,
            passwordError: !this.state.isValidName ? this.state.error : error
        });

    }

    _validateAccountName(value) {

        let error = value === "" ?
            counterpart.translate("account.name_input.empty_name") :
                ChainValidation.is_account_name_error(value) !== null ?
                    counterpart.translate("account." + ChainValidation.is_account_name_error(value)) : null;
        if(error){
            return {isValid: false, error: error};
        }
        if(!ChainValidation.is_cheap_name( value )){
            return {isValid: false, error: counterpart.translate("account.name_input.premium_name_warning") };
        }

        return {isValid: true, error: null};
    }

    _checkPasswordValidation(value1, value2){
        if(value1.length === 0){
            return {isValid: false, error: counterpart.translate("account.password_input.empty_password")};
        }else if(value1.length < 8){
            return {isValid: false, error: counterpart.translate("account.password_input.password_length_limit")};
        }else if(value2.length === 0){
            return {isValid: false, error: counterpart.translate("account.password_input.repeat_password") };
        }else if(value1 !== value2){
            return {isValid: false, error: counterpart.translate("account.password_input.different_repeat_password")};
        }else{
            return {isValid: true, error: null};
        }
    }

    _checkNameDuplication(){
      let ret = {isValid: true, error: null};
        this.props.searchAccounts.forEach( a => {
            if(a === this.props.searchTerm){
                ret =  {isValid: false, error: counterpart.translate("account.name_input.name_is_taken")};
            }
        });
        return ret;
    }

    onFinishConfirm(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName, undefined, {[this.state.accountName]: true}).then(() => {
                console.log("onFinishConfirm");
                this.props.router.push("/wallet/backup/create?newAccount=true");
            });
        }
    }

    createAccount(name) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        let referralAccount = AccountStore.getState().referralAccount;
        WalletUnlockActions.unlock().then(() => {
            this.setState({isLoading: true});

            AccountActions.createAccount(name, this.state.registrar_account, referralAccount || this.state.registrar_account, 0, refcode).then(() => {
                // User registering his own account
                if(this.state.registrar_account) {
                    FetchChain("getAccount", name, undefined, {[name]: true}).then(() => {
                        this.setState({
                            step: 2,
                            isLoading: false,
                            isRegistering: false
                        });
                    });
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else { // Account registered by the faucet
                    FetchChain("getAccount", name, undefined, {[name]: true}).then(() => {
                        this.setState({
                            step: 2,
                            isLoading: false,
                            isRegistering: false
                        });
                    });

                }
            }).catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let error_msg = error.base && error.base.length && error.base.length > 0 ? error.base[0] : "unknown error";
                if (error.remote_ip) error_msg = error.remote_ip[0];
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${error_msg}`,
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({isLoading: false,
                    isRegistering: false});
            });
        });
    }

    createWallet(password) {
        if(WalletDb.getWallet()){
            let walletName = WalletDb.getWallet().public_name;
            WalletActions.deleteWallet(walletName);
        }
        return WalletActions.setWallet(
            "default", //wallet name
            password
        ).then(()=> {
            console.log("Congratulations, your wallet was successfully created.");
        }).catch(err => {
            console.log("CreateWallet failed:", err);
            notify.addNotification({
                message: `Failed to create wallet: ${err}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }

    onSubmit(e) {
        e.preventDefault();
        if (!this.isValid()) return;
        let account_name = this.accountNameInput.getValue();
        if (WalletDb.getWallet()) {
            this.createAccount(account_name);
        } else {
            let password = this.refs.password.value();
            this.createWallet(password).then(() => this.createAccount(account_name));
        }
    }

    registerAccount() {
        if (!this.state.isValidName || !this.state.isValidPassword) return;
        let accountName = this.state.accountName;
        let password = this.state.password;
        this.setState({isRegistering: true});
        this.createWallet(password).then(() => this.createAccount(accountName));
    }


    _switchToRestore(){
        this.setState({
            action: 2
        });
    }

    _switchToRegister(){
        this.setState({
            action: 1
        });
    }

    _renderAccountCreateText() {
        let hasWallet = WalletDb.getWallet();
        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;

        return (
            <div className="confirm-checks" >
                <h4 style={{fontWeight: "bold", paddingBottom: 15, marginTop: 0}}><Translate content="wallet.wallet_browser" /></h4>

                <p>{!hasWallet ? <Translate content="wallet.has_wallet" /> : null}</p>

                <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text" />

                {firstAccount ?
                    <Translate style={{textAlign: "left"}} component="p" content="wallet.first_account_paid" /> :
                    <Translate style={{textAlign: "left"}} component="p" content="wallet.not_first_account" />}
            </div>
        );
    }

    _renderBackup() {
        return (
            <div className="backup-submit" style={{marginTop: "60px", padding: "20px", textAlign: "center"}}>
                <p><Translate unsafe content="wallet.wallet_crucial" /></p>
                <div className="divider" />
                <BackupCreate noText downloadCb={this._onBackupDownload}/>
            </div>
        );
    }

    _onBackupDownload = () => {
        let account = AccountStore.getState().currentAccount;
        if(account){
            this.context.router.push("/account/" + AccountStore.getState().currentAccount + "/overview");
        }
    }

    _renderBackupText() {
        return (
            <div>
                <p style={{fontWeight: "bold"}}><Translate content="footer.backup" /></p>
                <p><Translate content="wallet.wallet_move" unsafe /></p>
                <p className="txtlabel warning"><Translate unsafe content="wallet.wallet_lose_warning" /></p>
            </div>
        );
    }


    render() {

        let {step, action, isLoading, isRegistering } = this.state;
        let logo = require("assets/logo.png");

        //Search is a async procedure, so place the dup check here
        let ret = this._checkNameDuplication();

        let isValid = this.state.isValidName && this.state.isValidPassword && ret.isValid;
        let errMsg = !this.state.isValidName ? this.state.accountNameError : !ret.isValid ? ret.error : !this.state.isValidPassword ? this.state.passwordError :  "";

        return (
            <div style={{color: "#ffffff"}}>
                <div style={{margin: "60px auto 40px auto", textAlign: "center"}}>
                    <img src={logo} style={{width: 144, height: 60}} />
                </div>

                {action === 1 ?
                    (step === 1 ?
                        <div style={{margin: "20px 202px", textAlign: "center"}}>
                            <input type="text"  value={this.state.accountName} className="register-account white-placeholder"
                                placeholder={counterpart.translate("account.name_input.account_name")}  onChange= { (e) => {this.onAccountNameInput(e)}}
                            />
                            <input type="password" className="register-password white-placeholder" value={this.state.password}
                                   placeholder={counterpart.translate("account.password_input.input_password")} autoComplete="new-password"  onChange= {(e) => this.onPasswordInput(e)}
                            />
                            <input type="password" className="register-password white-placeholder" value={this.state.confirmPassword}
                                   placeholder={counterpart.translate("account.password_input.input_repeated_password")} autoComplete="new-password" onChange= {(e) => this.onPasswordConfirm(e)}
                            />
                            { isLoading ?  <div style={{height: 25}}><LoadingIndicator type="three-bounce"/></div> :
                                <div style={{height: 25, textAlign: "left", fontSize: "14px", color: "#ffb172"}}> {!isValid ? errMsg : " "} </div>}

                            <Translate content="account.tips.notice" style={{marginTop: 5, display: "block", textAlign: "left", fontSize: "12px", lineHeight: 1}}/>
                            <Translate content="account.tips.password_tip" style={{display: "block", textAlign: "left", fontSize: "12px", lineHeight: 1.1, marginTop: 5}} />
                            <button disabled={!isValid || isRegistering ? "disabled" : null} onClick={this.registerAccount.bind(this)}
                                    style={{ marginTop: 20, marginBottom: 12, paddingTop: "13px", paddingBottom: "14px", width: "100%"}}>
                                <Translate content="account.register" />
                            </button>
                            <a href="#" style={{marginTop: 12, fontSize: "12px", color: "#ffffff"}} onClick={ (e) => { e.preventDefault(); this._switchToRestore();}}>
                                {counterpart.translate("account.restore_from_backup")}
                                </a>
                        </div> :
                        <div className="backup-submit" style={{marginTop: "0", padding: "20px", textAlign: "center"}}>
                            <Translate style={{fontSize: 20, fontWeight: 600, color: "#ffffff"}} content="account.backup" />
                            <p style={{padding: "30px 180px 10px 180px", fontSize: 14, textAlign: "left"}}><Translate unsafe content="wallet.wallet_crucial" /></p>
                            <BackupCreate noText downloadCb={this._onBackupDownload} style={{color: "#ffffff"}}/>
                        </div>
                    ):
                    <div style={{margin: "50px 202px"}}>
                        <BackupRestore
                            toRegister={this._switchToRegister.bind(this)}
                            orgin = "1"
                            style={{color: "#ffffff"}}
                            />
                    </div>
                }
            </div>
        );
    }
}

export default connect(RegisterAccount, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            searchAccounts: AccountStore.getState().searchAccounts,
            searchTerm: AccountStore.getState().searchTerm,
            currentAccount: AccountStore.getState().currentAccount
        };
    }
});
