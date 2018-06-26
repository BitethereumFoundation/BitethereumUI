import React from "react";
import {Link} from "react-router/es";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import { connect } from "alt-react";
import utils from "common/utils";
import Translate from "react-translate-component";

class AccountsSettings extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.myAccounts, this.props.myAccounts) ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts
        );
    }

    render() {

        let {account} = this.props;
        return (
            <div style={{color: "#4d4d4d"}}>
                <div>
                    <span style={{fontSize: 16}}>
                            账户：
                    </span>
                    <span style={{ display: "inline-block", minWidth: 150, marginLeft: 5, border: "1px solid #d9d9d9", paddingTop: 7, paddingBottom: 7, textAlign: "center", fontSize: 16, background: "#f5f5f5"}}>
                            {account.get("name")}
                    </span>
                </div>
                <div style={{marginTop: 10}}>
                    <span style={{fontSize: 16}}>
                            ID：
                    </span>
                    <span style={{ display: "inline-block", minWidth: 150, marginLeft: 20,  border: "1px solid #d9d9d9", paddingTop: 7, paddingBottom: 7, textAlign: "center", fontSize: 16, background: "#f5f5f5"}}>
                            {"#" + account.get("id").substr(4)}
                    </span>
                </div>
            </div>
        );
    }
}

export default AccountsSettings;
