FTV-mergeUp tool
=========
This node module allow you to make some merge request automatically

How to use
----------------------------------------
1. Launch simply ``./node_modules/.bin/mergeUp init`` to set your conf
    * You can find your **gitlabPrivateToken** on the account tab of your profile page on GitLab.
    * The **gitDefaultUpstreamBranch** is often ``dev``but we can't force it for every project as the default value
2. Run ``./node_modules/.bin/mergeUp`` and let's roll ...
