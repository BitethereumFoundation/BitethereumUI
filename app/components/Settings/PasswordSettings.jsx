import React from "react";
import WalletChangePassword from "../Wallet/WalletChangePassword";

export default class PasswordSettings extends React.Component {
    render() {
        return <WalletChangePassword onSuccess={this.props.onSuccess.bind(this)}/>;
    }
};
