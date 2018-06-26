import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import SettleModal from "../Modal/SettleModal";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import {Market24HourChangeComponent} from "../Utility/MarketChangeComponent";
import AssetName from "../Utility/AssetName";
import MarginPositions from "./MarginPositions";
import { RecentTransactions } from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "bitsharesjs/es";
import SettingsActions from "actions/SettingsActions";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import {Link} from "react-router/es";
import ChainTypes from "../Utility/ChainTypes";
import EquivalentPrice from "../Utility/EquivalentPrice";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAssetById from "../Utility/LinkToAssetById";
import utils from "common/utils";
import BorrowModal from "../Modal/BorrowModal";
import ReactTooltip from "react-tooltip";
import { Apis } from "bitsharesjs-ws";
import {Tabs, Tab} from "../Utility/Tabs";
import AccountOrders from "./AccountOrders";
import cnames from "classnames";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import { checkMarginStatus } from "common/accountHelper";
import tableHeightHelper from "lib/common/tableHeightHelper";

class AccountOperationHistory extends React.Component {


    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balanceAssets, this.props.balanceAssets) ||
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    render() {
        let {account} = this.props;
        return (
            <div  style={{background: "#ffffff", padding: 10, height: 522}}>
                <div style={{fontSize: 16,paddingLeft: 20,  height: 36,  background: "#f0f0f0", border: "1px solid #e0e0e0"}}>
                    <Translate content="header.history" style={{ lineHeight: "36px", fontSize: 14, color: "#4d4d4d"}}/>
                </div>
                 <RecentTransactions
                                    accountsList={Immutable.fromJS([account.get("id")])}
                                    compactView={false}
                                    showMore={true}
                                    fullHeight={true}
                                    limit={15}
                                    showFilters={true}
                                    dashboard
                                    style={{height: 466, overflowY: "auto", border: "1px solid #e0e0e0", borderTop: "none"}}
                                />

            </div>

        );
    }
}

export default BindToChainState(AccountOperationHistory);
