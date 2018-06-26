import React, {PropTypes} from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Translate from "react-translate-component";
import QRCode from "qrcode.react";
import html2canvas from "html2canvas";
import {saveAs} from "file-saver";


class QrModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this._getInitialState();
        this.onClose = this.onClose.bind(this);
    }

    _getInitialState() {
        let account_name = this.props.accountName;
        let account_id = this.props.accountId;
        return {
            account_name: account_name,
            account_id: account_id
        };
    }

    show() {
        ZfApi.publish(this.props.modalId, "open");
        this.setState(this._getInitialState());
    }

    onCancel() {
        ZfApi.publish(this.props.modalId, "close");
        this.onClose();
    }

    onClose() {
        this.setState(this._getInitialState());
    }

    onDownload(){
        var fileName = this.props.accountName + "_qr.png";
        var qr_canvas = this.refs.qr._canvas;
        var ctx = qr_canvas.getContext("2d");
        var qrImgData = ctx.getImageData(0, 0, 220, 220);
        html2canvas(this.refs.img).then(function(canvas){
            var ctx = canvas.getContext("2d");
            ctx.putImageData(qrImgData,15,17);
            canvas.toBlob(function(blob) {
                saveAs(blob, fileName);
            });
        });
    }

    onMouseOver(){
        let img = this.refs.back;
        img.src = require("assets/back-hover.png");
        img.style.cursor = "hand";
    }

    onMouseLeave(){
        let img = this.refs.back;
        img.src = require("assets/back.png");
    }

    render() {
        return (
            <BaseModal onClose={this.onClose} id={this.props.modalId} ref="modal" noCloseBtn={true} overlay={true} overlayClose={false}
                       style={{width: 772, height: 500, padding: 0, margin: 0,
                           maxWidth: 772, position: "fixed", top: 80}}>

                <div className="text-center">
                    <div style={{position: "fixed", top: 30,  width: 772}}>
                        {/*<span style={{fontSize: 18, color: "#ffffff", paddingTop: 2}}>收款码</span>*/}
                        <Translate content="account.qr_code" style={{fontSize: 18, color: "#ffffff", paddingTop: 2}}/>
                        <a href onClick={this.onCancel.bind(this)}>
                        <img src={require("assets/back.png")} style={{position: "absolute", left: 20, height: 22, width: 22}} ref="back"
                             onMouseOver={this.onMouseOver.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)}/>
                        </a>
                    </div>
                    <div style={{margin: "30px auto 26px auto", padding: 16, background: "#f8f8f8", width: 250}} ref="img">
                        <section style={{textAlign: "center"}}>
                            <QRCode size={220} value={this.state.account_name} ref="qr"/>
                        </section>
                        <div style={{marginTop: 16}}>
                            <span style={{fontSize: 16, color: "#4d4d4d"}}>
                                ID: {this.state.account_id}
                            </span>
                        </div>
                    </div>
                    <div style={{marginTop: 25, borderTop: "1px solid #ebebeb"}}>
                        <button style={{marginTop: 30, padding: "14px 75px"}} onClick={this.onDownload.bind(this)}>
                            <Translate content="account.qr_download" style={{fontSize: 14}}/>
                        </button>
                    </div>
                </div>
            </BaseModal>
        );
    }
}

QrModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    accountName: PropTypes.string.isRequired,
    accountId: PropTypes.string.isRequired
};
QrModal.defaultProps = {
    modalId: "qr_code_account_name_modal"
};
export default QrModal;
