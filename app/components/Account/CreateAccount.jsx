import React from "react";
import { connect } from "alt-react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import PasswordInput from "./../Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import {Link} from "react-router/es";
import AccountSelect from "../Forms/AccountSelect";
import WalletUnlockActions from "actions/WalletUnlockActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "../LoadingIndicator";
import WalletActions from "actions/WalletActions";
import Translate from "react-translate-component";
import {ChainStore, FetchChain, ChainValidation} from "bitsharesjs/es";
import {BackupCreate} from "../Wallet/Backup";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";


class CreateAccount extends React.Component {
    constructor() {
        super();
        this._isMounted = false;
        this.state = {
            //validAccountName: false,
            accountName: "",
            //validPassword: false,
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
            isLoading: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.accountNameInput = null;
    }



    componentWillMount() {
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

    componentDidMount() {
        this._isMounted = true;
        ReactTooltip.rebuild();
    }

    componentWillUnmount(){
        this._isMounted = false;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state) 
            || nextProps.searchAccounts !== this.props.searchAccounts
            || nextProps.searchTerm !== this.props.searchTerm;
            // || nextState.accountName !== this.state.accountName
            // || nextState.isLoading !== this.state.isLoading;
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
            "请输入账户名" :
            ChainValidation.is_account_name_error(value);
        if(error){
            return {isValid: false, error: error};
        }
        if(!ChainValidation.is_cheap_name( value )){
            return {isValid: false, error: "账户名至少包含一个横杠、数字或者不含元音字母" }
        }

        return {isValid: true, error: null};
    }

    _checkPasswordValidation(value1, value2){
        if(value1.length === 0){
            return {isValid: false, error: "请输入密码"};
        }else if(value1.length < 8){
            return {isValid: false, error: "密码长度不能小于8位"};
        }else if(value2.length === 0){
            return {isValid: false, error: "请再次输入密码" };
        }else if(value1 !== value2){
            return {isValid: false, error: "两次输入的密码不一致"};
        }else{
            return {isValid: true, error: null}
        }
    }



    // isValidAccountName(){
    //     return !this.state.error;
    // }

    _checkNameDuplication(){
      let ret = {isValid: true, error: null};
        this.props.searchAccounts.forEach( a => {
            if(a === this.props.searchTerm){
                ret =  {isValid: false, error: "账户名已使用"};
            }
        });
        return ret;
    }


    onFinishConfirm(confirm_store_state) {

        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName, undefined, {[this.state.accountName]: true}).then(() => {
                this.props.router.push("/wallet/backup/create?newAccount=true");
            });
        }
    }

    _waitForMount(){
        return;
    }
    createAccount(name) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        let referralAccount = AccountStore.getState().referralAccount;
        WalletUnlockActions.unlock().then(() => {
            this.setState({isLoading: true});
            // let timestamp = Date.parse(new Date());
            // timestamp = timestamp / 1000;
            // console.log(timestamp)
            // let target = timestamp + 5;
            // while(timestamp < target){
            //     timestamp = Date.parse(new Date());
            //     timestamp = timestamp / 1000;
            // }
            // this.setState({isLoading: false, step: 2});

            AccountActions.createAccount(name, this.state.registrar_account, referralAccount || this.state.registrar_account, 0, refcode).then(() => {
                // User registering his own account
                if(this.state.registrar_account) {
                    FetchChain("getAccount", name, undefined, {[name]: true}).then(() => {
                        this.setState({
                            step: 2,
                            isLoading: false
                        });
                    });
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else { // Account registered by the faucet
                    FetchChain("getAccount", name, undefined, {[name]: true})
                        .then(() => {
                        this.setState({
                            step: 2,
                            isLoading: false
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
                this.setState({isLoading: false});
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
        this.createWallet(password).then(() => this.createAccount(accountName));
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

                {/* {this.state.hide_refcode ? null :
                    <div>
                        <RefcodeInput ref="refcode" label="refcode.refcode_optional" expandable={true}/>
                        <br/>
                    </div>
                } */}
            </div>
        );
    }

    _renderBackup() {
        return (
            <div className="backup-submit">
                <p><Translate unsafe content="wallet.wallet_crucial" /></p>
                <div className="divider" />
                <BackupCreate noText downloadCb={this._onBackupDownload}/>
            </div>
        );
    }

    _validateRegistration(){

    }

    _onBackupDownload = () => {
        this.setState({
            step: 3
        });
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
        let {step} = this.state;
        let logo = require("assets/logo.png");

        //Search is a async procedure, so place the dup check here
        let ret = this._checkNameDuplication();


        let isValid = this.state.isValidName && this.state.isValidPassword && ret.isValid;
        let errMsg = !this.state.isValidName ? this.state.accountNameError : !ret.isValid ? ret.error : !this.state.isValidPassword ? this.state.passwordError :  "";

        return (
            <div>
                <div style={{margin: "60px auto 40px auto", textAlign: "center"}}>
                    <img src={logo} style={{width: 258, height: 58}} />
                </div>
                {step === 1 ?
                    <div style={{margin: "20px 202px", textAlign: "center"}}>
                        <input type="text"  value={this.state.accountName} className="register-account"
                            placeholder="账户名称"  onChange= { (e) => {this.onAccountNameInput(e)}}
                        />

                        <input type="password" className="register-password" value={this.state.password}
                               placeholder="请输入账户密码" autoComplete="new-password"  onChange= {(e) => this.onPasswordInput(e)}
                        />

                        <input type="password" className="register-password" value={this.state.confirmPassword}
                               placeholder="请确认账户密码" autoComplete="new-password" onChange= {(e) => this.onPasswordConfirm(e)}
                        />
                        { this.state.isLoading ?  <div style={{height: 25}}><LoadingIndicator type="three-bounce"/></div> :
                            <div style={{height: 25, textAlign: "left", fontSize: "12px", color: "#ff3950"}}> {!isValid ? errMsg : " "} </div>}

                        <span style={{marginTop: 5, display: "block", textAlign: "left", fontSize: "12px", lineHeight: 1}}>注意:</span>
                        <span style={{display: "block", textAlign: "left", fontSize: "12px", lineHeight: 1.1, marginTop: 5}}>请牢记您的密码，ChainBook不存储您的密码，也不提供找回功能。</span>
                        <button disabled={!isValid ? "disabled" : null} onClick={this.registerAccount.bind(this)} style={{ marginTop: 20, marginBottom: 12, paddingTop: "13px", paddingBottom: "14px", width: "100%", border: "1px solid #539cf2"}}>
                            创建帐号
                        </button>
                        <a href="#" style={{marginTop: 12, fontSize: "12px"}}>从备份文件导入帐号</a>
                    </div> :
                    <div style={{margin: "20px 202px", textAlign: "center"}}>
                        <p style={{fontWeight: "bold"}}><Translate content="footer.backup" /></p>
                        <p><Translate content="wallet.wallet_move" unsafe /></p>
                        <p className="txtlabel warning"><Translate unsafe content="wallet.wallet_lose_warning" /></p>
                    </div>

                }
            </div>

        );
    }
}

export default connect(CreateAccount, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            searchAccounts: AccountStore.getState().searchAccounts,
            searchTerm: AccountStore.getState().searchTerm
        };
    }
});
