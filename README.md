FTV-mergeUp tool
=========
This node module allows you to handle all the merge request workflow.

<u>Params</u> :
* **'-t, --title'**, merge request title (ex: 'Bug fixes')
* **'-P, --upstreamProject'**, upstream project name (ex: team/project)
* **'-b, --localBranch'**, local branch name (ex: bugfix)
* **'-B, --upstreamBranch'**, upstream branch name (ex: dev)
* **'-s, --silent'**, desactivate hipChat notification

<u>The different steps are</u> :
* Get config params (*upstreamProject, localBranch, upstreamBranch*) from your git context. 
<br />All these params can be overwritten when you launch the command.
* Call the GitLab API to search for an opened merge request with this title and corresponding to all the given params
* Create or update the merge request depending on the previous call's answer
<br />You can update a merge request by simply running ``mergeUp``, the title is mandatory only for creation and in update if specified
* Notify to the HipChat room (defined in config.json) with a custom message depending on the case


Subcommands
----------------------------------------

### Init
``mergeUp init`` to set up your conf
* You can find your **gitlabPrivateToken** on the account tab of your profile page on GitLab.
* The **gitDefaultUpstreamBranch** is often ``dev``but we can't force it for every project as the default value

### Verify
``mergeUp verify <iid>`` is used to fetch the merge request branch and create a local environment in order to test it.

<u>Actions</u> :
* **'--validate'**, accept the merge request
* **'--refuse'**, add a refuse comment on GitLab
* **'--clean'**, remove environment

<u>The verify process steps are</u> :
* Fetch all  merge request data
* Create a local branch based on the one in the pending merge request
* Checkout on it
* Done !

You can now launch tests or try whatever you want with the code.

#### --validate
``mergeUp verify <iid> --validate`` allow you to accept directly from the terminal, after verifying it, the merge request on GitLab and notify the room about it.

#### --refuse
``mergeUp verify <iid> --refuse <message>`` post the ``message`` the as a comment and add a prefix *[To Fix]* on the title. The room is also notified.

#### --clean
``mergeUp verify [iid] --clean`` clean the environment created by ``verify`` for the given merge request (branch, remote etc.). 
<br />If no iid is given remove all environments instead.


### Fix
``mergeUp fix`` is an override command of the native one, used when the merge request has been refused.
<br />It does the same process but have a different notification message and remove the [To Fix] prefix on the merge request title
