import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "./FormattedAsset";
import FloatingDropdown from "./FloatingDropdown";
import Immutable from "immutable";
import counterpart from "counterpart";

class AssetSelector extends React.Component {

    static propTypes = {
        assets: ChainTypes.ChainAssetsList,
        value: React.PropTypes.string, // asset id
        onChange: React.PropTypes.func
    };

    render() {
        if(this.props.assets.length === 0) return null;

        return <FloatingDropdown
            entries={this.props.assets.map(a => a && a.get("symbol")).filter(a => !!a)}
            values={this.props.assets.reduce((map, a) => {if (a && a.get("symbol")) map[a.get("symbol")] = a; return map;}, {})}
            singleEntry={this.props.assets[0] ? <FormattedAsset asset={this.props.assets[0].get("id")} amount={0} hide_amount={true}/> : null}
            value={this.props.value}
            onChange={this.props.onChange}
        />;
    }
}

AssetSelector = BindToChainState(AssetSelector);

class AmountSelector extends React.Component {

    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        asset: ChainTypes.ChainAsset.isRequired, // selected asset by default
        assets: React.PropTypes.array,
        amount: React.PropTypes.any,
        placeholder: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired,
        tabIndex: React.PropTypes.number,
        error: React.PropTypes.string
    };

    static defaultProps = {
        disabled: false
    };

    componentDidMount() {
        this.onAssetChange(this.props.asset);
    }

    formatAmount(v) {
        /*// TODO: use asset's precision to format the number*/
        if (!v) v = "";
        if (typeof v === "number") v = v.toString();
        let value = v.trim().replace(/,/g, "");

        return value;
    }

    _onChange(event) {
        let amount = event.target.value;
        let reg = /^[0-9]+(\.{0,1})[0-9]*$/;
        let is_number = reg.test(amount)

        if(!is_number && amount !== ""){
            return;
        }

        reg = /^0+/;
        if(reg.test(amount)){
            if(amount >= 1){
                amount = amount.replace(/^0+/, "");
            }else if(amount > 0){
                amount = amount.replace(/^0+/, 0);
            }
        }

        this.props.onChange({amount: amount, asset: this.props.asset});
    }

    onAssetChange(selected_asset) {
        this.props.onChange({amount: this.props.amount, asset: selected_asset});
    }

    render() {
        let value = this.props.error ? counterpart.translate(this.props.error) : this.formatAmount(this.props.amount);
        return (
            <div className="amount-selector" style={this.props.style}>
                {/*<label className="right-label">{this.props.display_balance}</label>*/}
                <span style={{float: "right",  fontSize: 12,color: "#4d4d4d",display: "inline-block", lineHeight: "30px"}}>{this.props.display_balance}</span>
                <div className="inline-label input-wrapper" >
                    <span style={{display: "inline-block", width: 60, fontSize: 14, color: "#4d4d4d", lineHeight: "34px"}}>{this.props.label}</span>

                    <input
                        disabled={this.props.disabled}
                        type="text"
                        value={value || ""}
                        placeholder={this.props.placeholder}
                        onChange={this._onChange.bind(this) }
                        tabIndex={this.props.tabIndex}
                        style={{width: 500, paddingLeft: 11, height: 34, fontSize: 14, textTransform: "lowercase", color: "#4d4d4d", background: "#ffffff", border: "1px solid #e0e0e0"}}
                    />
                    <div className="form-label select floating-dropdown" style={{width: 150, textAlign: "right", height: 34, background: "#f5f5f5", border: "1px solid #e0e0e0"}}>
                        <AssetSelector
                            ref={this.props.refCallback}
                            value={this.props.asset.get("symbol")}
                            assets={Immutable.List(this.props.assets)}
                            onChange={this.onAssetChange.bind(this)}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
AmountSelector = BindToChainState(AmountSelector);

export default AmountSelector;
