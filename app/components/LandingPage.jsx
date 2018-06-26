import React from "react";
import AccountStore from "stores/AccountStore";
import {connect} from "alt-react";
import LoadingIndicator from "./LoadingIndicator";

class LandingPage extends React.Component {

    constructor(props, context) {
        super(props, context);
    }
    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    componentWillMount(){
        if(this.props.accountsReady){
            let myAccount = this.props.currentAccount;
            if(!myAccount){
                this.context.router.push("/account-register");
            }else{
                this.context.router.push("/account/" + myAccount + "/dashboard");
            }
        }
    }

    componentWillUpdate(nextProps){
        if(nextProps.accountsReady ){
            let myAccount = this.props.currentAccount;
            if(!myAccount){
                this.context.router.push("/account-register");
            }else{
                this.context.router.push("/account/" + myAccount + "/dashboard");
            }
        }
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.accountsReady !== this.props.accountsReady;
    }

    render(){
        if (!this.props.accountsReady) {
            return <LoadingIndicator />;
        }else{
            return null;
        }
    }
}

export default connect(LandingPage, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            accountsReady: AccountStore.getState().accountsLoaded && AccountStore.getState().refsLoaded
        };
    }
});
