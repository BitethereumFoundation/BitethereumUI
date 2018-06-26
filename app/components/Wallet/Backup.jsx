import React, {PropTypes, Component} from "react";
import {Link} from "react-router/es";
import {FormattedDate} from "react-intl";
import { connect } from "alt-react";
import WalletActions from "actions/WalletActions";
import WalletManagerStore from "stores/WalletManagerStore";
import BackupStore from "stores/BackupStore";
import WalletDb from "stores/WalletDb";
import BackupActions, {backup, decryptWalletBackup} from "actions/BackupActions";
import notify from "actions/NotificationActions";
import {saveAs} from "file-saver";
import cname from "classnames";
import Translate from "react-translate-component";
import {ChainConfig} from "bitsharesjs-ws";
import {PrivateKey} from "bitsharesjs/es";
import SettingsActions from "actions/SettingsActions";
import WalletUnlockActions from "actions/WalletUnlockActions";
import AccountStore from "stores/AccountStore";
import counterpart from "counterpart";

const connectObject = {
    listenTo() {
        return [WalletManagerStore, BackupStore];
    },
    getProps() {
        let wallet = WalletManagerStore.getState();
        let backup = BackupStore.getState();
        return { wallet, backup };
    }
};

//The default component is WalletManager.jsx
class BackupCreate extends Component {
    render() {
        {/*<div style={{maxWidth: "40rem"}}>*/}
        return (
            <div>
                <Create noText={this.props.noText} newAccount={this.props.location ? this.props.location.query.newAccount : null}>
                    <NameSizeModified  style={this.props.style}/>
                    {this.props.noText ? null : <Sha1/>}
                    <Download downloadCb={this.props.downloadCb}  noText={this.props.noText}/>
                </Create>
            </div>
        );
    }
}
BackupCreate = connect(BackupCreate, connectObject);

// layout is a small project
// class WalletObjectInspector extends Component {
//     static propTypes={ walletObject: PropTypes.object }
//     render() {
//         return <div style={{overflowY:'auto'}}>
//             <Inspector
//                 data={ this.props.walletObject || {} }
//                 search={false}/>
//         </div>
//     }
// }

class BackupRestore extends Component {

    static propTypes = {
        //toRegister: React.PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            newWalletName: null
        };


    }

    componentWillMount() {
        BackupActions.reset();
    }

    render() {
        // let new_wallet = this.props.wallet.new_wallet
        let orgin = this.props.orgin === "1" ? 1 : 2;
        return (
            <div>
                { orgin === 1 ? <Translate content="wallet.import_backup" style={{fontWeight: "bold", fontSize: 18, display: "block", textAlign: "center", margin: "30px auto"}} /> : null}
                {(new FileReader).readAsBinaryString ? null : <p className="error">Warning! You browser doesn't support some some file operations required to restore backup, we recommend you to use Chrome or Firefox browsers to restore your backup.</p>}
                <Upload toRegister={this.props.toRegister ? this.props.toRegister.bind(this) : null} orgin={orgin}>
                    <NameSizeModified style={this.props.style}/>
                    <Restore orgin={orgin} saveWalletObject={true}/>
                </Upload>
            </div>
        );
    }
}

BackupRestore = connect(BackupRestore, connectObject);

// class Restore extends Component {
//
//     constructor() {
//         super()
//         this.state = { }
//     }
//
//     isRestored() {
//         let new_wallet = this.props.wallet.new_wallet;
//         let has_new_wallet = this.props.wallet.wallet_names.has(new_wallet);
//         return has_new_wallet;
//     }
//
//     render() {
//         let new_wallet = this.props.wallet.new_wallet
//         let has_new_wallet = this.isRestored()
//
//         if(has_new_wallet)
//             return <span>
//                 <h5><Translate content="wallet.restore_success" name={new_wallet.toUpperCase()} /></h5>
//                 <Link to="/">
//                     <div className="button outline">
//                         <Translate component="span" content="header.dashboard" />
//                     </div>
//                 </Link>
//                 <div>{this.props.children}</div>
//             </span>
//
//         return <span>
//             <h3><Translate content="wallet.ready_to_restore" /></h3>
//             <div className="button outline"
//                 onClick={this.onRestore.bind(this)}><Translate content="wallet.restore_wallet_of" name={new_wallet} /></div>
//         </span>
//     }
//
//     onRestore() {
//         WalletActions.restore(
//             this.props.wallet.new_wallet,
//             this.props.backup.wallet_object
//         );
//         SettingsActions.changeSetting({
//             setting: "passwordLogin",
//             value: false
//         });
//     }
// }

class Restore extends Component {

    static propTypes = {
        saveWalletObject: PropTypes.bool
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    constructor() {
        super()
        this.state = this._getInitialState()
    }

    _getInitialState() {
        return {
            backup_password: "",
            new_wallet: null
        }
    }

    onPassword(e) {
        if (e) e.preventDefault();
        let private_key = PrivateKey.fromSeed(this.state.backup_password || "")
        let contents = this.props.backup.contents
        decryptWalletBackup(private_key.toWif(), contents).then( wallet_object => {
            if(this.props.saveWalletObject)
                BackupStore.setWalletObjct(wallet_object)
            this.acceptWallet();
            this.restore();
            if(this.props.orgin !== 1){
                //WalletManagerStore.init()
                AccountStore.reset();
                WalletUnlockActions.lock();
                //Promise.all([AccountStore.reset()]).then(()=>{window.location.href="/";});
                this.context.router.push("/");
                //window.location.href="/";
            }

        }).catch( error => {
            console.error("Error verifying wallet " + this.props.backup.name,
                error, error.stack)
            if(error === "invalid_decryption_key")
                notify.error("Invalid Password")
            else
                notify.error(""+error)
        })
    }

    formChange(event) {
        let state = {}
        state[event.target.id] = event.target.value
        this.setState(state);
    }

    acceptWallet(){
        let has_current_wallet = !!this.props.wallet.current_wallet
        if( ! has_current_wallet) {
            let walletName = "default";
            if (this.props.backup.name) {
                walletName = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            }
            WalletManagerStore.setNewWallet(walletName)
            this.setState({accept: true})
        }

        if( has_current_wallet && this.props.backup.name && ! this.state.new_wallet) {
            // begning of the file name might make a good wallet name
            // let walletName = WalletDb.getWallet().public_name;
            // WalletActions.deleteWallet(walletName);
            let new_wallet = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            if( new_wallet )
                this.setState({new_wallet})

            WalletManagerStore.setNewWallet(new_wallet);
        }
    }

    restore() {
        WalletActions.restore(
            this.props.wallet.new_wallet,
            this.props.backup.wallet_object
        );
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

    isRestored() {
        let new_wallet = this.props.wallet.current_wallet;
        let has_new_wallet = this.props.wallet.wallet_names.has(new_wallet);
        return has_new_wallet;
    }

    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        let submitButton = (
            <button
                type="submit"
                onClick={this.onPassword.bind(this)}
                style={ this.props.orgin === 1 ?
                    { width: 174, height: 40, marginRight: 10, float: "left" }
                    : {width: 120, height: 40, left: 0, position: "absolute", border: "1px solid rgb(83, 156, 242)"}
                }
            >
               <Translate content="wallet.import" />
            </button>
        );

        let passwordInput = (
            <input type="password" id="backup_password"
                   onChange={this.formChange.bind(this)}
                   value={this.state.backup_password}
                   style={ this.props.orgin === 1 ? {color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.55)",
                           background: "rgba(255, 255, 255, 0.1)"} :
                       {color: "#000000", border: "1px solid rgb(217, 217, 217)",
                           background: "rgba(255, 255, 255, 0.1)", width: 400}
                   }
                   placeholder={counterpart.translate("account.password_input.input_password")}
                   className={ this.props.orgin === 1 ? "white-placeholder" : null}
            />
        )
        return (
            <form onSubmit={this.onPassword.bind(this)}>
                {passwordInput}
                <Sha1/>
                {submitButton}
            </form>);
    }


}

Restore = connect(Restore, connectObject);

class NewWalletName extends Component {

    constructor() {
        super()
        this.state = {
            new_wallet: null,
            accept: false
        }
    }

    componentWillMount() {
        let has_current_wallet = !!this.props.wallet.current_wallet
        if( ! has_current_wallet) {
            let walletName = "default";
            if (this.props.backup.name) {
                walletName = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            }
            WalletManagerStore.setNewWallet(walletName)
            this.setState({accept: true})
        }
        if( has_current_wallet && this.props.backup.name && ! this.state.new_wallet) {
            // begning of the file name might make a good wallet name
            let new_wallet = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            if( new_wallet )
                this.setState({new_wallet})
            WalletManagerStore.setNewWallet(new_wallet)
        }
    }

    render() {
        if(this.state.accept)
            return <span>{this.props.children}</span>

        let has_wallet_name = !!this.state.new_wallet
        if(this.props.wallet.wallet_names.has(this.state.new_wallet)){
            WalletManagerStore.onDeleteWallet(this.state.new_wallet);
        }

        return (
        <form onSubmit={this.onAccept.bind(this)}>
            <h5><Translate content="wallet.new_wallet_name" /></h5>
            <input
                type="text"
                id="new_wallet"
                onChange={this.formChange.bind(this)}
                value={this.state.new_wallet}
            />
            {/*<p>{ has_wallet_name_conflict ? <Translate content="wallet.wallet_exist" /> : null}</p>*/}
            <div onClick={ this.onAccept.bind(this) } type="submit" className={cname("button outline", {disabled: ! has_wallet_name})}>
                <Translate content="wallet.accept" />
            </div>
        </form>);
    }

    onAccept(e) {
        if (e) e.preventDefault();
        this.setState({accept: true})
        WalletManagerStore.setNewWallet(this.state.new_wallet)
    }

    formChange(event) {
        let key_id = event.target.id
        let value = event.target.value
        if(key_id === "new_wallet") {
            //case in-sensitive
            value = value.toLowerCase()
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return;
        }
        let state = {}
        state[key_id] = value
        this.setState(state)
    }
}
NewWalletName = connect(NewWalletName, connectObject);

class Download extends Component {

    componentWillMount() {
        try { this.isFileSaverSupported = !!new Blob; } catch (e) {}
    }

    componentDidMount() {
        if( ! this.isFileSaverSupported )
            notify.error("File saving is not supported")
    }

    render() {
        return <div  className={cname("button exist-download")}
            onClick={this.onDownload.bind(this)}><Translate content="wallet.download" /></div>
    }

    onDownload() {
        let blob = new Blob([ this.props.backup.contents ], {
            type: "application/octet-stream; charset=us-ascii"})

        if(blob.size !== this.props.backup.size)
            throw new Error("Invalid backup to download conversion")
        saveAs(blob, this.props.backup.name);
        WalletActions.setBackupDate();

        if (this.props.downloadCb) {
            this.props.downloadCb();
        }
    }
}
Download = connect(Download, connectObject);

class Create extends Component {

    getBackupName() {
        let name = this.props.wallet.current_wallet
        let address_prefix = ChainConfig.address_prefix.toLowerCase()
        if(name.indexOf(address_prefix) !== 0)
            name = address_prefix + "_" + name

        let date =  new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let stampedName = `${name}_${date.getFullYear()}${month >= 10 ? month : "0" + month}${day >= 10 ? day : "0" + day}`;

        name = stampedName + ".bin";

        return name;
    }

    render() {

        let has_backup = !!this.props.backup.contents
        if( has_backup ) return <div>{this.props.children}</div>

        let ready = WalletDb.getWallet() != null

        return (
            <div>
                {this.props.noText ? null :
                <div style={{textAlign: "left"}}>
                    {this.props.newAccount ? <Translate component="p" content="wallet.backup_new_account"/> : null}
                    <Translate style={{color: "#666666", fontSize: 14, lineHeight: 1.3}} content="wallet.backup_explain"/>
                </div>}
                <div
                    onClick={this.onCreateBackup.bind(this)}
                    className={cname("button ", {disabled: !ready}, "exist-backup")}
                    // style={{marginBottom: 10, marginTop: 30, width: 200, height: 40}}
                >
                    <Translate content="wallet.create_backup"/>
                </div>
                {/*<LastBackupDate/>*/}
            </div>
        );
    }

    onCreateBackup() {
        let backup_pubkey = WalletDb.getWallet().password_pubkey
        backup(backup_pubkey).then( contents => {
            let name = this.getBackupName();
            BackupActions.incommingBuffer({name, contents})
        })
    }
}
Create = connect(Create, connectObject);

class LastBackupDate extends Component {
    render() {
        if (!WalletDb.getWallet()) {
            return null;
        }
        let backup_date = WalletDb.getWallet().backup_date
        let last_modified = WalletDb.getWallet().last_modified
        let backup_time = backup_date ?
            <h4><Translate content="wallet.last_backup" /> <FormattedDate value={backup_date}/></h4>:
            <Translate style={{paddingTop: 20}} className="facolor-error" component="p" content="wallet.never_backed_up" />
        let needs_backup = null
        if( backup_date ) {
            needs_backup = last_modified.getTime() > backup_date.getTime() ?
                <h4 className="facolor-error"><Translate content="wallet.need_backup" /></h4>:
                <h4 className="success"><Translate content="wallet.noneed_backup" /></h4>
        }
        return <span>
            {backup_time}
            {needs_backup}
        </span>
    }
}

class Upload extends Component {

    constructor(){
        super();
        this.state = {
            uploadFile: null
        };
    }

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    reset() {
        // debugger;
        // this.refs.file_input.value = "";
        BackupActions.reset();
    }

    render() {

        // let resetButton = (
        //     <div style={{paddingTop: 30}}>
        //         <div
        //             onClick={this.reset.bind(this)}
        //             className={cname("button outline", {disabled: !this.props.backup.contents})}
        //         >
        //             <Translate content="wallet.reset" />
        //         </div>
        //     </div>
        // );

        let resetButton = (
            <button
                onClick={this.reset.bind(this)}
                disabled={!this.props.backup.contents}
                style={ this.props.orgin === 1 ?
                    { width: 174, height: 40, marginLeft: 10, float: "right" }
                    : {width: 120, height: 40, left: 140, position: "absolute", border: "1px solid rgb(83, 156, 242)"}
                }
            >
                <Translate content="wallet.reset" />
            </button>
        );

        let importButton = (
                <button
                    disabled={!this.state.uploadFile ? "disabled": null}
                    onClick={this.onFileUpload.bind(this)}
                    style={ this.props.orgin === 1 ?
                        { width: 174, height: 40, marginRight: 10 }
                        : {width: 120, height: 40, left: 0, position: "absolute", border: "1px solid rgb(83, 156, 242)"}
                    }
                >
                    <Translate content="wallet.import" />
                </button>
        );

        let backButton = (
            <button className="back" onClick={()=>{this.props.toRegister();}}>
                {/*<span>返回</span>*/}
                <Translate content="wallet.back"/>
            </button>
        );

        if(
            this.props.backup.contents &&
            this.props.backup.public_key
        )
            return <span>{this.props.children}{resetButton}</span>;

        let is_invalid =
            this.props.backup.contents &&
            ! this.props.backup.public_key;
        //let borderStyl= {this.props.orgin === 1 ? {}}
        let orgin = this.props.orgin;
        let inputFileStyle = Object.assign({}, {margin: 0, float: "left", width: 267, height: 40, borderRight: "none"},
            orgin === 1 ? {border: "1px solid rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.1)"} :
                {width: 300,  border: "1px solid #d9d9d9", background: "rgba(255,255,255,0.1)", fontSize: 14, height: 34, color: "#000000" });

        let inputButtonStyle = Object.assign({},{float: "left", width:100, height: 40,fontSize: 14},
            orgin === 1 ? {background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.55)"} :
                {background: "#f0f0f0", border: "1px solid #d9d9d9", height: 34});
        let inputUploadStyle = Object.assign({position: "absolute", top:0, opacity:0, zIndex: 1, }, orgin === 1 ?{right:0, width: "100%", height: 41} :{left: 0, width: 400, height: 34});
        return (
            <div style={{textAlign: "center", position: "relative"}}>
                <input ref="fileName" placeholder="未选择任何文件" type="text"
                       style={inputFileStyle} className="white-placeholder"
                />
                <input type="button" style={inputButtonStyle} value="选择文件"/>
                <input ref="file_input" accept=".bin" type="file" id="backup_input_file" style={inputUploadStyle}
                    onChange={this.onFileSelect.bind(this)} />
                <div style={{clear: "both"}}/>
                {orgin === 1 ? <Translate style={{textAlign: "left", margin: "20px auto", fontSize: 14}} component="p" content="wallet.import_backup_choose" /> : null}
                { is_invalid ? <h5><Translate content="wallet.invalid_format" /></h5> : null }
                <div style={ orgin === 1 ? {marginTop: 50 } : {marginTop: 30}}>
                    {importButton}
                    { orgin === 1 ? backButton : null}
                </div>
            </div>
        );
    }

    onFileSelect(evt){
        let file = evt.target.files[0];
        this.setState({uploadFile: file});
        this.refs.fileName.value = file ? file.name : "";
    }


    onFileUpload() {
        // let file = evt.target.files[0];

        //this.refs.fileName = file.name;
        let file = this.state.uploadFile;
        if(file){
            BackupActions.incommingWebFile(file);
            this.forceUpdate();
        }

    }
}
Upload = connect(Upload, connectObject);

class NameSizeModified extends Component {
    render() {
        return <span>
            <h5 style={this.props.style}><b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)</h5>
            {this.props.backup.last_modified ?
                <div>{this.props.backup.last_modified}</div> : null }
            <br/>
        </span>
    }
}
NameSizeModified = connect(NameSizeModified, connectObject);

class DecryptBackup extends Component {

    static propTypes = {
        saveWalletObject: PropTypes.bool
    }

    constructor() {
        super()
        this.state = this._getInitialState()
    }

    _getInitialState() {
        return {
            backup_password: "",
            verified: false
        }
    }

    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        let submitButton = (
            <button
                type="submit"
                onClick={this.onPassword.bind(this)}
                style={ this.props.orgin === 1 ?
                    { width: 174, height: 40, marginRight: 10, float: "left" }
                    : {width: 120, height: 40, left: 0, position: "absolute", border: "1px solid rgb(83, 156, 242)"}
                }
            >
                <Translate content="wallet.import" />
            </button>
        );

        let passwordInput = (
            <input type="password" id="backup_password"
                   onChange={this.formChange.bind(this)}
                   value={this.state.backup_password}
                   style={ this.props.orgin === 1 ? {color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.55)",
                       background: "rgba(255, 255, 255, 0.1)"} :
                       {color: "#000000", border: "1px solid rgba(0, 0, 0, 0.55)",
                           background: "rgba(255, 255, 255, 0.1)", width: 500}
                   }
                   placeholder="请输入密码"
                   className={this.props.orgin === 1 ? "white-placeholder" : null}
            />
        )
        return (
         <form onSubmit={this.onPassword.bind(this)}>
            {/*<label><Translate content="wallet.enter_password" style={{color: "#ffffff"}}/></label>*/}
            {/*<input type="password" id="backup_password"*/}
                {/*onChange={this.formChange.bind(this)}*/}
                {/*value={this.state.backup_password}*/}
                {/*style={{color: "#000000", border: "1px solid rgba(255, 255, 255, 0.55)", background: "rgba(255, 255, 255, 0.1)"}}*/}
                {/*placeholder="请输入密码"*/}
                {/*className="white-placeholder"*/}
            {/*/>*/}
             {passwordInput}
            <Sha1/>
            {/*<div*/}
                {/*type="submit"*/}
                {/*className="button outline"*/}
                {/*onClick={this.onPassword.bind(this)}*/}
            {/*>*/}
                {/*<Translate content="wallet.submit" />*/}
            {/*</div>*/}
             {submitButton}
        </form>);
    }

    onPassword(e) {
        if (e) e.preventDefault();
        let private_key = PrivateKey.fromSeed(this.state.backup_password || "")
        let contents = this.props.backup.contents
        decryptWalletBackup(private_key.toWif(), contents).then( wallet_object => {
            this.setState({verified: true})
            if(this.props.saveWalletObject)
                BackupStore.setWalletObjct(wallet_object)
            WalletActions.restore(
                this.props.wallet.new_wallet,
                this.props.backup.wallet_object
            );
            SettingsActions.changeSetting({
                setting: "passwordLogin",
                value: false
            });
        }).catch( error => {
            console.error("Error verifying wallet " + this.props.backup.name,
                error, error.stack)
            if(error === "invalid_decryption_key")
                notify.error("Invalid Password")
            else
                notify.error(""+error)
        })
    }

    formChange(event) {
        let state = {}
        state[event.target.id] = event.target.value
        this.setState(state);
    }

}
DecryptBackup = connect(DecryptBackup, connectObject);

class Sha1 extends Component {
    render() {
        return <div>
            <pre className="no-overflow">{this.props.backup.sha1} * SHA1</pre>
            <br/>
        </div>;
    }
}
Sha1 = connect(Sha1, connectObject);

export {BackupCreate, BackupRestore, Restore, NewWalletName,
    Download, Create, Upload, NameSizeModified, DecryptBackup, Sha1};
