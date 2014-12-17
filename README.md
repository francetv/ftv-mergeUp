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
1. Duplicate the **config.dist.json** file and name it **config.json**
2. Set the following values :

<pre><code>"gitDefaultUpstreamBranch": ""
"gitlabPrivateToken": ""</code></pre>

You can find your gitlabPrivateToken on the account tab of your profile page on GitLab.
The default upstream branch is often ``dev``but we can't force it for every project
3. Run ```./node_modules/.bin/mergeUp``` and let's roll ...
