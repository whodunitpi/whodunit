## What's Whodunit?

Whodunit helps you to investigate application issues, providing a framework for troubleshooting production environments.

To do so, we provide an [investigator ecosystem]. An investigator is basically a plugin that can be run with the `pi` command to troubleshoot your production environment.

## Setup

```sh
# build it
npm install
lerna bootstrap

# run it
node packages/whodunit-pi/lib/cli.js
```

## Usage

```sh
# install pi
npm install --global @whodunit/pi

# install an investigator
npm install --global investigator-ipauth

# run it
pi ipauth
```

You can also run a local investigator on your computer as such:

```sh
# Running a local investigator
pi ./path/to/local/investigator
```

## Options

- `--no-color` - Disable colors.
- `--version` - Print the current `pi` version.
- `--help` - Print `pi` help menu with the list of found investigators.
- `--investigators` - Print available investigators.

## Investigator

An investigator basically runs a decision tree or flow diagram to isolate issues to a root cause.

```None
+---------------------+  yes   +----------------------------+  yes
|  isIPAuthenticated  +------->+isSecondGatewayAuthenticated+-------> ipWorking
+----------+----------+        +----------------------------+
           |                                 |no
           |                                 v
           |no                     sessionCacheNotWorking
           |
           v
     +-----+---+       no
     |isIPKnown+---------------> ipNotKnown
     +----+----+
          |yes
          |
          v
 +--------+-----------+    yes
 |isCustomerSubscribed+-----------> defectInGateway
 +--------------------+
           |no
           v
 customerNotSubscribed
```

You write Investigations and Conclusions, then you link them together in an Investigator.

* Investigations - Answer yes or no questions about system conditions.
* Conclusions - A description of your findings and recommended actions.
* Investigator - Links Investigations and Conclusions to form a decision tree.

```
investigate() {
    const { isIPKnown, isCustomerSubscribed, 
        isIPAuthenticated, isSecondGatewayAuthenticated } 
        = this.investigations;
        
    const { ipNotKnown, customerNotSubscribed, sessionCacheNotWorking, 
        ipWorking, defectInGateway } 
        = this.conclusions;
    
    isIPAuthenticated
        .yes(isSecondGatewayAuthenticated)
        .no(isIPKnown);

    isSecondGatewayAuthenticated
        .yes(ipWorking)
        .no(sessionCacheNotWorking);

    isIPKnown
        .yes(isCustomerSubscribed)
        .no(ipNotKnown);

    isCustomerSubscribed
        .yes(defectInGateway)
        .no(customerNotSubscribed);

    return this.start(isIPAuthenticated);
}
```

An example of an investigation looks like this...
```
module.exports = class extends Investigation {
    async investigate(yes, no) {
        const ipAuthAppName = "RESOURCEMANAGEMENT.SHARED.IPAUTHMIDDLE";
        const ipAuthService = await getEurekaInstance(ipAuthAppName, this.props.env);

        if (!ipAuthService) {
            this.props.message = chalk.redBright(`Unable to get instance for ${ipAuthAppName} from eureka!`);
            return;
        }

        try {
            const url = `${ipAuthService}ipauthmiddle/authenticate`;
            const ip = {
                ipAddress: this.props.ip
            };
            this.log(`Trying ${url} for ${this.props.ip}`);
            const { status, data } = await axios.post(url, ip);

            if(status === 200 || no(`${this.props.ip} is unknown IP`)) {
                this.props.custGroup = `${data.custId}.${data.groupId}`;
                yes(`${this.props.ip} is known IP: custGroup=${this.props.custGroup}`);
            } 
        } catch (err) {
            no(`${this.props.ip} is unknown IP: ${err.message}`);
        }
    }
};
```

An example of a conclusion looks like this...
```
module.exports = {
    ipNotKnown: {
        text: "IP is not known",
        details: "Either the IP range is not configured in Admin for ${props.ip} " +
        "or the configuration is failing to sync to the IPAuthentication service.",
        recommendations: [
            "Check in admin to see that the IP range should include ${props.ip}",
            "Contact [ArtfulDodgers](mailto:Med.ArtfulDodgers@ebsco.com) with these findings.",
            "Development should check that the IPAuthentication sync process",
        ],
        status: "fail"
    }
};
```

## Why derive Whodunit from Yeoman?

Whodunit uses a fork of the Yeoman framework for code generators, except Whodunit shares investigators instead.

* Yeoman provides a proven ecosystem for code generators that now includes over 8000 generators, 9000 github stars and 37000 weekly downloads. Its architecture is a major reason for the success of the ecosystem.
* Yeoman was created by engineers at Google.
* The plugin design allows an investigator to run in different environments. Developers can write once and use many different ways. For example

    * CLI
    * Native UI
    * Web Site
    * End-to-end tests
    * Synthetic transactions
    * Self-documenting runbook or playbook
    * Focused investigators can be reused by broader investigators. For example, an investigator package can be created for each micro-service and the gateway can implement an investigator that reuses those investigators to isolate the root cause of an authentication issue.

* Uses npm to publish and discover investigator packages.

## License

BSD-2-Clause © Google (Original Author of yeoman) © Ken Goodridge (Derived from yeoman)
