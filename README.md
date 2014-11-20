MergeUp tool
=========
This node module allow you to make some merge request automatically

How to install
----------------------------------------
Install the package directly from the gitlab repository into the dev dependencies.
```
npm install --save-dev git+ssh://git@gitlab.ftven.net:team-player/mergeup.git#dev
```

If the prompt ask for ssh authorization just type yes.

How to use
----------------------------------------
1. Modify the **gitlabPrivateToken** in the **config.json** file.
In order to get your private token go your gitlab profile page (<a href="http://gitlab.ftven.net/profile/account" target="_blank">click here</a>)
2. Run ```./node_modules/.bin/mergeUp``` and let's roll ...