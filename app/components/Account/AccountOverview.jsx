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
import QrModal from "../Modal/QrModal";

class AccountOverview extends React.Component {

    static propTypes = {
        balanceAssets: ChainTypes.ChainAssetsList,
        core_asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        core_asset: "1.3.0"
    };

    constructor(props) {
        super();
        this.state = {
            sortKey: props.viewSettings.get("portfolioSort", "totalValue"),
            alwaysShowAssets: [
                "BITE"
            ]
        };

        for (let key in this.sortFunctions) {
            this.sortFunctions[key] = this.sortFunctions[key].bind(this);
        }
    }

    sortFunctions = {
        alphabetic: function(a, b, force) {
            if (a.key > b.key) return this.state.sortDirection || force ? 1 : -1;
            if (a.key < b.key) return this.state.sortDirection || force ? -1 : 1;
            return 0;
        },
    };


    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }
    _renderBalances(balanceList, optionalAssets, visible) {

        let balances = [];
        balanceList.forEach( balance => {
            let balanceObject = ChainStore.getObject(balance);
            let asset_type = balanceObject.get("asset_type");
            let asset = ChainStore.getObject(asset_type);
            if (!asset) return null;
            let symbol = asset.get("symbol");
            balances.push(
                <div key={symbol} style={{height: 80, paddingLeft: "20px", paddingRight: "20px", borderBottom: "1px solid #ebebeb"}}>
                    <span style={{display: "inline-block", height: 50, width: 50, borderRadius: 50, float: "left", margin:"15px 0", border: "1px solid #e0e0e0"}}>
                    <img className="align-center"  style={{ height: 30, width: 30,float: "left", margin: 9}} src={`${__BASE_URL__}asset-symbols/${symbol.toLowerCase()}.png`} />
                    </span>
                    <span style={{margin: "30px 20px", float: "left"}}>{symbol}</span>
                    <span style={{float: "right", margin: "30px 0"}}><BalanceComponent balance={balance}/></span>
                    {/*<span style={{float: "right", margin: "30px 0"}}>{amount} {symbol}</span>*/}
                </div>
            );
        });

        if (optionalAssets) {
            let keep = true;
            optionalAssets.filter(asset => {
                balances.forEach(a => {
                    if (a.key === asset) keep = false;
                });
                return keep;
            }).forEach(a => {
                let asset = ChainStore.getAsset(a);
                let symbol = asset.get("symbol");
                if (asset && this.props.isMyAccount) {
                    balances.push(
                        <div key={symbol} style={{height: 80, paddingLeft: "20px", paddingRight: "20px", borderBottom: "1px solid #ebebeb"}}>
                            <span style={{display: "inline-block", height: 50, width: 50, borderRadius: "50%", float: "left", margin:"15px 0", border: "1px solid #e0e0e0"}}>
                                <img className="align-center"  style={{height: 30, width: 30,float: "left", margin: 10}} src={`${__BASE_URL__}asset-symbols/${symbol.toLowerCase()}.png`} />
                            </span>
                            <span style={{margin: "30px 20px", float: "left"}}>{symbol}</span>
                            <span style={{float: "right", margin: "30px 0", }}><span style={{color: "rgb(25, 117, 213)"}}>0</span> {symbol}</span>
                        </div>
                    );
                }
            });
        }
        balances.sort(this.sortFunctions[this.state.sortKey]);
        return balances;
    }

    showQrCode(){
        this.refs.qrmodal.show();
    }

    render() {

        let {account} = this.props;

        if (!account) {
            return null;
        }

        let account_balances = account.get("balances");

        let balanceList = null;

        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            account_balances = account_balances.filter((a, index) => {
                let balanceObject = ChainStore.getObject(a);
                if (balanceObject && (!balanceObject.get("balance"))) {
                    return false;
                } else {
                    return true;
                }
            });

            balanceList = this._renderBalances(account_balances, this.state.alwaysShowAssets, true);
        }

        let currentAccount = this.props.account.get("name");
        let accountId = "#" + this.props.account.get("id").substr(4);

        return (
            <div ref="appTables" style={{height:522, width: "100%", borderTop: "1px solid #ffffff"}}>
                <div style={{height: 162, paddingTop: 40, background: "transparent", paddingLeft: "30px", color: "rgba(255,255,255,0.9)"}}>
                    <div style={{float: "left"}}>
                        <Translate content="explorer.account.title"  className="account-info-title" />
                        <span className="account-info-title">
                            ID：
                        </span>
                    </div>
                    <div style={{float: "left"}}>
                        <span className="account-info-content">
                            {currentAccount}
                        </span>
                        <span className="account-info-content">
                            {accountId}
                        </span>
                    </div>
                    <div style={{float: "right", marginTop: 55}}>
                        <a href onClick={ (e) => {e.preventDefault(); this.showQrCode()}}>
                            <img style={{float: "right", width: 32, height: 32, marginRight: 20}} src={require("assets/qr.png")} />
                        </a>
                    </div>
                </div>
                <div style={{height: 359, backgroundColor: "#fff", fontSize: 20, color: "#4d4d4d"}}>
                    {balanceList}
                </div>
                <QrModal ref="qrmodal" accountName={account.get("name")} accountId={account.get("id").substr(4)} />
            </div>

        );
    }
}

AccountOverview = BindToChainState(AccountOverview);

class BalanceWrapper extends React.Component {

    static propTypes = {
        balances: ChainTypes.ChainObjectsList,
    };

    static defaultProps = {
        balances: Immutable.List(),
        orders: Immutable.List()
    };

    render() {

        return (
            <AccountOverview {...this.state} {...this.props} />
        );
    };
}

export default BindToChainState(BalanceWrapper);
