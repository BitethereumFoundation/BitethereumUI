import React from "react";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import notify from "actions/NotificationActions";
import cnames from "classnames";
import Translate from "react-translate-component";
import counterpart from "counterpart";

export default class Airdrop extends React.Component {

    constructor(){
        super();
        this.state = {
            airdrop_signature: null,
            airdrop_coin_type: 1, // 1: ETH, 2: BTC
            eth_signed_message: null,
            btc_signed_message: null,
            is_sending_request: false
        };
    }

    _import_airdrop(){
        if(this.state.airdrop_signature && this.state.airdrop_coin_type){
            if(!this._check_signature(this.state.airdrop_signature)){
                notify.addNotification({
                    children: (
                        <div>
                            <p>
                                <Icon name="cross-circle" size="1x" className="error airdrop" />
                                <Translate content="settings.airdrop_invalid_sig" className="notification-message" />
                            </p>
                        </div>
                    ),
                    level: "error",
                    autoDismiss: 3
                });
                return;
            }
            this.setState({is_sending_request: true});
            try{
                AccountActions.importAirdrop(this.props.account, this.state.airdrop_signature, this.state.airdrop_coin_type).then(() =>{
                    notify.addNotification({
                        children: (
                            <div>
                                <p>
                                   <Icon name="checkmark-circle" size="1x" className="success airdrop" />
                                    <Translate className="success-text notification-message" content="settings.airdrop_claim_success"/>
                                </p>
                            </div>
                        ),
                        level: "success",
                        autoDismiss: 3
                    });
                    this._onReset();
                    this.setState({
                        is_sending_request: false
                    });
                }).catch(() => {
                    notify.addNotification({
                        children: (
                            <div>
                                <p>
                                    <Icon name="cross-circle" size="1x" className="error airdrop" />
                                    <Translate className="notification-message" content="settings.airdrop_claim_failed"/>
                                </p>
                            </div>
                        ),
                        level: "error",
                        autoDismiss: 3
                    });
                    this.setState({
                        is_sending_request: false
                    });

                });
            }catch(err) {
                notify.addNotification({
                    children: (
                        <div>
                            <p>
                                <Icon name="cross-circle" size="1x" className="error airdrop" />
                                <Translate content="settings.airdrop_invalid_sig" className="notification-message" />
                            </p>
                        </div>
                    ),
                    level: "error",
                    autoDismiss: 3
                });
                this.setState({
                    is_sending_request: false
                });
            }finally {

            }
        }
    }

    _change_coin_type(coin_type){
        this.setState({
            airdrop_coin_type: coin_type,
        });
        this.refs.sig_input.value = coin_type === 1 ?
            this.state.eth_signed_message : this.state.btc_signed_message;
    }

    _onReset(){
        this.setState({
            airdrop_signature: null,
            eth_signed_message: null,
            btc_signed_message: null
        });
        this.refs.sig_input.value = "";
    }

    _check_signature(signature){
        let base64Rex = /^[0-9a-zA-Z+\/]+=$/;
        let hexRex = /^[0-9a-fA-F]{130}$/;
        return this.state.airdrop_coin_type === 1 ? hexRex.test(signature) : base64Rex.test(signature);
    }
    _onSignatureInput(e){
        let input = e.target.value.trim();
        if(this.state.airdrop_coin_type === 1 && input.startsWith("0x")){
            input = input.substr(2);
        }
        this.setState({
            airdrop_signature: input
        });
        if(this.state.airdrop_coin_type === 1){
            this.setState({
                eth_signed_message: input
            });
        }else{
            this.setState({
                btc_signed_message: input
            });
        }
    }
    render(){
        if(Date.parse(new Date()) >= 1522598400000){
            return null;
        }

        let airdrop_type_lable = this.state.airdrop_coin_type === 1 ?
                                counterpart.translate("settings.airdrop_eth_label") :
                                counterpart.translate("settings.airdrop_btc_label");
        let airdrop_type_tip = this.state.airdrop_coin_type === 1 ?
                                counterpart.translate("settings.airdrop_eth_signed_message") :
                                counterpart.translate("settings.airdrop_btc_signed_message");

        return(
            <div>
                <div>
                <ul className="button-group segmented no-margin no-border">
                    <li className={this.state.airdrop_coin_type === 1 ? " is-active" : ""} onClick={this._change_coin_type.bind(this, 1)} ><a className="coin-selection-tab left">ETH</a></li>
                    <li className={this.state.airdrop_coin_type === 2  ? "is-active" : ""} onClick={this._change_coin_type.bind(this, 2)}><a className="coin-selection-tab">BTC</a></li>
                </ul>
                </div>
                <div style={{margin: "15px 0"}}>
                    <Translate content="settings.airdrop_notice" style={{fontSize: 12, color: "#666666"}} />
                </div>
                <div className="inline-label input-wrapper" style={{border: "1px solid #d9d9d9"}}>
                    <span style={{width: 100, textAlign: "center", lineHeight: "34px",
                        fontSize: 14, color: "#4d4d4d", height: 34, borderRight: "1px solid #d9d9d9",
                    background: "#f0f0f0"}}>{airdrop_type_lable}</span>
                    <input ref="sig_input" className="no-border" style={{height: 34, paddingLeft: 10, fontSize: 14, color: "#4d4d4d"}}
                           placeholder={airdrop_type_tip}
                           onChange={this._onSignatureInput.bind(this)}
                    />
                </div>
                <div style={{marginTop: 30}}>
                    <div className={cnames("button", {disabled: this.state.is_sending_request})}
                         onClick={this._onReset.bind(this)}
                         style={{width: 120, height: 40}}>
                        <Translate content="settings.airdrop_reset" />
                    </div>
                    <button
                        className={cnames("button", {disabled:
                            this.state.airdrop_coin_type === 1 && !this.state.eth_signed_message
                            || this.state.airdrop_coin_type === 2 && !this.state.btc_signed_message
                            || this.state.is_sending_request})}
                        type="submit"
                        style={{width: 120, height: 40}}
                        onClick={this._import_airdrop.bind(this)}
                    >
                        <Translate content="settings.airdrop_claim" />
                    </button>
                </div>
            </div>
        );
    }
}