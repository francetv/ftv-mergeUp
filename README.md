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
1. Create a mergeUpConfig.json file on the root of your project with the following content :
```
{
    "gitDefaultUpstreamBranch": ""
    "gitlabPrivateToken": ""
}
```

2. Set the following values :
    * You can find your **gitlabPrivateToken** on the account tab of your profile page on GitLab.
    * The **gitDefaultUpstreamBranch** is often ``dev``but we can't force it for every project as the default value
3. Run ``./node_modules/.bin/mergeUp`` and let's roll ...
