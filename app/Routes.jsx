import React from "react";

import { Route, IndexRoute, Redirect } from "react-router/es";
import willTransitionTo from "./routerTransition";
import App from "./App";

/*
* Electron does not support async loading of components via System.import,
* so we make sure they're bundled already by including them here
*/
if (__ELECTRON__ || __HASH_HISTORY__) {
    require("./electron_imports");
}

class Auth extends React.Component {
    render() {return null; }
}

function loadRoute(cb, moduleName = "default") {
    return (module) => cb(null, module[moduleName]);
}

function errorLoading(err) {
    console.error("Dynamic page loading failed", err);
}

const routes = (
    <Route path="/" component={App} onEnter={willTransitionTo}>
        <IndexRoute getComponent={(location, cb) => {
            System.import("components/LandingPage").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/account-register" getComponent={(location, cb) => {
            System.import("components/RegisterAccount").then(loadRoute(cb)).catch(errorLoading);
        }}/>

        <Route path="wallet" getComponent={(location, cb) => {
            System.import("components/Wallet/WalletManager").then(loadRoute(cb, "WalletManager")).catch(errorLoading);
        }}>
            {/* wallet management console */}
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Wallet/WalletManager").then(loadRoute(cb, "WalletOptions")).catch(errorLoading);
            }}/>
            <Route path="change" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletManager").then(loadRoute(cb, "ChangeActiveWallet")).catch(errorLoading);
            }}/>
            <Route path="change-password" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletChangePassword").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="import-keys" getComponent={(location, cb) => {
                System.import("components/Wallet/ImportKeys").then(loadRoute(cb, "ExistingAccountOptions")).catch(errorLoading);
            }}/>
            <Route path="brainkey" getComponent={(location, cb) => {
                System.import("components/Wallet/Brainkey").then(loadRoute(cb, "ExistingAccountOptions")).catch(errorLoading);
            }}/>
            <Route path="create" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletCreate").then(loadRoute(cb, "WalletCreate")).catch(errorLoading);
            }}/>
            <Route path="delete" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletManager").then(loadRoute(cb, "WalletDelete")).catch(errorLoading);
            }}/>
            <Route path="backup/restore" getComponent={(location, cb) => {
                System.import("components/Wallet/Backup").then(loadRoute(cb, "BackupRestore")).catch(errorLoading);
            }}/>
            <Route path="backup/create" getComponent={(location, cb) => {
                System.import("components/Wallet/Backup").then(loadRoute(cb, "BackupCreate")).catch(errorLoading);
            }}/>
            <Route path="backup/brainkey" getComponent={(location, cb) => {
                System.import("components/Wallet/BackupBrainkey").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="balance-claims" getComponent={(location, cb) => {
                System.import("components/Wallet/BalanceClaimActive").then(loadRoute(cb)).catch(errorLoading);
            }}/>
        </Route>

        <Route path="create-wallet" getComponent={(location, cb) => {
            System.import("components/Wallet/WalletCreate").then(loadRoute(cb, "WalletCreate")).catch(errorLoading);
        }}/>

        <Route path="create-wallet-brainkey" getComponent={(location, cb) => {
            System.import("components/Wallet/WalletCreate").then(loadRoute(cb, "CreateWalletFromBrainkey")).catch(errorLoading);
        }}/>

        <Route path="transfer" getComponent={(location, cb) => {
            System.import("components/Transfer/Transfer").then(loadRoute(cb)).catch(errorLoading);
        }}/>


        <Route path="settings" getComponent={(location, cb) => {
            System.import("components/Settings/SettingsContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>

        <Route path="existing-account" getComponent={(location, cb) => {
            System.import("components/Wallet/ExistingAccount").then(loadRoute(cb, "ExistingAccount")).catch(errorLoading);
        }}>
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Wallet/Backup").then(loadRoute(cb, "BackupRestore")).catch(errorLoading);
            }}/>
            <Route path="import-backup" getComponent={(location, cb) => {
                System.import("components/Wallet/ExistingAccount").then(loadRoute(cb, "ExistingAccountOptions")).catch(errorLoading);
            }}/>
            <Route path="import-keys" getComponent={(location, cb) => {
                System.import("components/Wallet/ImportKeys").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="brainkey" getComponent={(location, cb) => {
                System.import("components/Wallet/Brainkey").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="balance-claim" getComponent={(location, cb) => {
                System.import("components/Wallet/BalanceClaimActive").then(loadRoute(cb)).catch(errorLoading);
            }}/>
        </Route>

        <Route path="/account/:account_name" getComponent={(location, cb) => {
            System.import("components/Account/AccountPage").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Account/AccountOverview.jsx").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="dashboard" getComponent={(location, cb) => {
                System.import("components/Account/AccountOverview.jsx").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="assets" getComponent={(location, cb) => {
                System.import("components/Account/AccountAssets").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="create-asset" getComponent={(location, cb) => {
                System.import("components/Account/AccountAssetCreate").then(loadRoute(cb, "AccountAssetCreate")).catch(errorLoading);
            }}/>
            <Route path="update-asset/:asset" getComponent={(location, cb) => {
                System.import("components/Account/AccountAssetUpdate").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="member-stats" getComponent={(location, cb) => {
                System.import("components/Account/AccountMembership").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="vesting" getComponent={(location, cb) => {
                System.import("components/Account/AccountVesting").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="permissions" getComponent={(location, cb) => {
                System.import("components/Account/AccountPermissions").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="voting" getComponent={(location, cb) => {
                System.import("components/Account/AccountVoting").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="orders" getComponent={(location, cb) => {
                System.import("components/Account/AccountOrders").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="whitelist" getComponent={(location, cb) => {
                System.import("components/Account/AccountWhitelist").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="signedmessages" getComponent={(location, cb) => {
                System.import("components/Account/AccountSignedMessages").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="operation-history" getComponent={(location, cb) => {
                System.import("components/Account/AccountOperationHistory").then(loadRoute(cb)).catch(errorLoading);
            }} />
            <Redirect from="overview" to="dashboard" />
        </Route>

        <Route path="/init-error" getComponent={(location, cb) => {
            System.import("components/InitError").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/help" getComponent={(location, cb) => {
            System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <Route path=":path1" getComponent={(location, cb) => {
                System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
            }}>
                <Route path=":path2" getComponent={(location, cb) => {
                    System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
                }}>
                    <Route path=":path3" getComponent={(location, cb) => {
                        System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
                    }} />
                </Route>
            </Route>
        </Route>
    </Route>
);

export default routes;
