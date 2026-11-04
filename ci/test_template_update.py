"""The update door (scripts/template-update.py), run against throwaway local
repositories, plus the shape of what ships with it.

    python3 ci/test_template_update.py -v

Adopted from lentago/uvularia's scripts/tests/test_template_update.py at commit
5189e456e48be2feba91c4fbe32b9b185cfe59f3 (uvularia ADR-0003, this kit's
ADR-0005). The update and push-step tests are uvularia's, with this kit's file
names in the fixture. WhatShips holds this kit's copy instead of uvularia's
three templates.

No network, no GitHub: the "template repository" is a bare repo on disk and the
"client" is a repo whose first commit has exactly the template's tree, which is
what "Use this template" makes. What is held (uvularia#112 and ADR-0003, monarda#42 and ADR-0005):

  * a file the client never changed becomes the template's; a file the template
    added arrives; a file the template removed goes; the base is recorded;
  * a file the client changed and the template did not stays the client's;
    both changed on different lines merge; on the same lines, conflict markers
    and a count; the client's removals and the template's removals of changed
    files are left alone and listed;
  * nothing under `keep`, nor the config, is ever added, changed or removed;
  * no base (first commit matches nothing) means nothing is removed and every
    replacement is listed; an up-to-date repository gets no change at all;
  * in the template repository itself, a dirty checkout, and modes: the script
    does nothing, refuses, and keeps the executable bit; a damaged or unfetchable
    recorded base, or an uncommitted file where the template adds one, stops the
    run instead of overwriting anything;
  * the script is still the byte-for-byte copy of uvularia's, the config names
    this template and keeps what must never change, campaign.config.ts is
    merged with the template's new settings and keeps the client's values, and
    the workflow is pinned, keeps the token out of every step that does not
    push, and asks for no write permission it does not use.
"""
from __future__ import annotations

import hashlib
import os
import re
import subprocess
import tempfile
import tomllib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "template-update.py"
WORKFLOW = ROOT / ".github" / "workflows" / "template-update.yml"
ENV = {**os.environ, "GIT_CONFIG_GLOBAL": "/dev/null", "GIT_CONFIG_NOSYSTEM": "1",
       "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example", "GIT_COMMITTER_NAME": "t",
       "GIT_COMMITTER_EMAIL": "t@example", "GITHUB_REPOSITORY": "client-org/client-site"}
ENV.pop("GITHUB_OUTPUT", None)

CONFIG = """source = "example/site-template"
branch = "main"
keep = ["content/", ".github/CODEOWNERS", "LICENSE"]
"""
DOC = "".join(f"line {i}\n" for i in range(1, 13))
SETTINGS = """export default {
  name: "Your campaign name",
  tagline: "One sentence about what you are raising money for.",
  goal: 10000,
  accent: "#1b4b2e",
};
"""


def git(*args, cwd):
    return subprocess.run(["git", *args], cwd=cwd, check=True, text=True, capture_output=True,
                          env=ENV).stdout.strip()


def write(root: Path, files: dict[str, str | None]):
    for rel, text in files.items():
        p = root / rel
        if text is None:
            p.unlink()
            continue
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)


class Fixture:
    """A bare template repo at v1, and a client made from it ("Use this template")."""

    V1 = {
        ".github/template-update.toml": CONFIG,
        ".github/workflows/ci.yml": "name: ci\n",
        "README.md": "# template\nv1\n",
        "doc.md": DOC,
        "old.txt": "the template will remove this\n",
        "tweaked.txt": "the client will change this; the template will remove it\n",
        "gone.txt": "the client will remove this; the template will change it\n",
        "scripts/tool.sh": "#!/bin/sh\necho v1\n",
        "campaign.config.ts": SETTINGS,
        "content/home.md": "Replace this with your home page.\n",
        ".github/CODEOWNERS": "* @template-maintainer\n",
        "LICENSE": "MIT\n",
    }

    def __init__(self, tmp: Path):
        self.tmp = tmp
        self.bare = tmp / "template.git"
        git("init", "-q", "--bare", "-b", "main", str(self.bare), cwd=tmp)
        self.work = tmp / "template"
        git("clone", "-q", str(self.bare), str(self.work), cwd=tmp)
        self.v1 = self.template_commit(self.V1, "v1")
        os.chmod(self.work / "scripts/tool.sh", 0o755)
        git("add", "-A", cwd=self.work)
        git("commit", "-q", "-m", "v1 exec", cwd=self.work)
        git("push", "-q", "origin", "HEAD:main", cwd=self.work)
        self.v1 = git("rev-parse", "HEAD", cwd=self.work)

        # The client: a fresh repository whose one commit is the template's tree.
        self.client = tmp / "client"
        self.client.mkdir()
        git("init", "-q", "-b", "main", cwd=self.client)
        git("--work-tree", str(self.client), "checkout", "-q", self.v1, "--", ".",
            cwd=self.work)
        git("add", "-A", cwd=self.client)
        git("commit", "-q", "-m", "Initial commit", cwd=self.client)

    @property
    def url(self):
        return f"file://{self.bare}"

    def template_commit(self, files, msg):
        write(self.work, files)
        git("add", "-A", cwd=self.work)
        git("commit", "-q", "-m", msg, cwd=self.work)
        git("push", "-q", "origin", "HEAD:main", cwd=self.work)
        return git("rev-parse", "HEAD", cwd=self.work)

    def client_commit(self, files, msg="client change"):
        write(self.client, files)
        git("add", "-A", cwd=self.client)
        git("commit", "-q", "-m", msg, cwd=self.client)

    def run(self, *extra, env=None):
        r = subprocess.run(["python3", str(SCRIPT), "--root", str(self.client),
                            "--template-url", self.url, "--body", str(self.tmp / "body.md"),
                            "--issue-body", str(self.tmp / "issue.md"), *extra],
                           capture_output=True, text=True, env=env or ENV)
        out = dict(line.split("=", 1) for line in r.stdout.splitlines()
                   if re.fullmatch(r"[a-z]+=\S*", line))
        return r, out

    def read(self, rel):
        return (self.client / rel).read_text()

    def staged(self):
        return git("diff", "--cached", "--name-status", cwd=self.client)

    def body(self):
        return (self.tmp / "body.md").read_text()


class UpdateDoor(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.f = Fixture(Path(self._tmp.name))

    def tearDown(self):
        self._tmp.cleanup()

    def test_untouched_files_follow_the_template_and_the_base_is_recorded(self):
        v2 = self.f.template_commit({"README.md": "# template\nv2\n", "new.txt": "added\n",
                                     "old.txt": None}, "v2")
        r, out = self.f.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(out["changed"], "true")
        self.assertEqual(out["attention"], "0")
        self.assertEqual(self.f.read("README.md"), "# template\nv2\n")
        self.assertEqual(self.f.read("new.txt"), "added\n")
        self.assertFalse((self.f.client / "old.txt").exists())
        self.assertIn(v2, self.f.read(".github/template-base"))
        self.assertIn("(inferred)", r.stdout)
        body = self.f.body()
        self.assertIn("`README.md (updated)`", body)
        self.assertIn("`new.txt (added)`", body)
        self.assertIn("`old.txt (removed)`", body)
        self.assertIn(f"compare/{self.f.v1}...{v2}", body)

    def test_the_keep_list_and_the_config_are_never_touched(self):
        self.f.template_commit({"content/home.md": "changed\n", "content/news.md": "x\n",
                                ".github/CODEOWNERS": "* @someone-else\n", "LICENSE": None,
                                ".github/template-update.toml": CONFIG + "# new default\n",
                                "README.md": "# template\nv2\n"}, "v2")
        r, out = self.f.run()
        self.assertEqual(out["changed"], "true", r.stderr)
        staged = self.f.staged()
        for path in ("content/", "CODEOWNERS", "LICENSE", "template-update.toml"):
            self.assertNotIn(path, staged)
        self.assertFalse((self.f.client / "content/news.md").exists())
        self.assertEqual(self.f.read("LICENSE"), "MIT\n")
        self.assertEqual(self.f.read(".github/template-update.toml"), CONFIG)
        for path in ("content/home.md", "content/news.md", ".github/CODEOWNERS", "LICENSE",
                     ".github/template-update.toml"):
            self.assertIn(f"`{path}`", self.f.body().split("Not touched")[1])

    def test_a_file_only_you_changed_stays_yours(self):
        self.f.client_commit({".github/workflows/ci.yml": "name: ci\non: push\n"})
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        r, out = self.f.run()
        self.assertEqual(out["changed"], "true", r.stderr)
        self.assertEqual(self.f.read(".github/workflows/ci.yml"), "name: ci\non: push\n")

    def test_both_changed_different_lines_merge(self):
        self.f.client_commit({"doc.md": DOC.replace("line 1\n", "line 1 (ours)\n")})
        self.f.template_commit({"doc.md": DOC.replace("line 12\n", "line 12 (template)\n")},
                               "v2")
        r, out = self.f.run()
        self.assertEqual(out["attention"], "0", r.stderr)
        doc = self.f.read("doc.md")
        self.assertIn("line 1 (ours)", doc)
        self.assertIn("line 12 (template)", doc)
        self.assertIn("Merged with your changes", self.f.body())

    def test_a_new_setting_arrives_and_your_values_stay(self):
        # campaign.config.ts is not on keep (ADR-0005): when the kit gains a setting,
        # the update brings it in and every value the client filled in stays theirs.
        self.f.client_commit({"campaign.config.ts": SETTINGS
                              .replace("Your campaign name", "Pennywell Winter Shelves")
                              .replace("10000", "4500")})
        self.f.template_commit({"campaign.config.ts": SETTINGS.replace(
            '  accent: "#1b4b2e",\n', '  accent: "#1b4b2e",\n  rung: 1,\n')}, "v2")
        r, out = self.f.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(out["attention"], "0")
        settings = self.f.read("campaign.config.ts")
        self.assertIn('name: "Pennywell Winter Shelves"', settings)
        self.assertIn("goal: 4500", settings)
        self.assertIn("rung: 1,", settings)
        self.assertIn("`campaign.config.ts`", self.f.body().split("Merged with your changes")[1])

    def test_both_changed_same_lines_conflict_and_say_so(self):
        self.f.client_commit({"doc.md": DOC.replace("line 6\n", "line 6 (ours)\n")})
        self.f.template_commit({"doc.md": DOC.replace("line 6\n", "line 6 (template)\n")},
                               "v2")
        r, out = self.f.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(out["attention"], "1")
        doc = self.f.read("doc.md")
        self.assertIn("<<<<<<< yours", doc)
        self.assertIn(">>>>>>> template now", doc)
        self.assertIn("Needs you", self.f.body())

    def test_removals_of_changed_files_are_left_and_listed(self):
        self.f.client_commit({"tweaked.txt": "ours now\n", "gone.txt": None})
        self.f.template_commit({"tweaked.txt": None, "gone.txt": "template changed it\n"},
                               "v2")
        r, out = self.f.run()
        self.assertEqual(out["changed"], "false", r.stderr)
        self.assertEqual(self.f.read("tweaked.txt"), "ours now\n")
        self.assertFalse((self.f.client / "gone.txt").exists())
        self.assertIn("`tweaked.txt`", self.f.body().split("Left as you have them")[1])
        self.assertIn("`gone.txt`", self.f.body().split("Left removed")[1])

    def test_up_to_date_changes_nothing(self):
        r, out = self.f.run()
        self.assertEqual(out["changed"], "false", r.stderr)
        self.assertEqual(self.f.staged(), "")
        self.assertFalse((self.f.client / ".github/template-base").exists())

    def test_a_recorded_base_is_used(self):
        v2 = self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        # The client took v2 by hand and recorded it; v3 changes doc.md only.
        self.f.client_commit({"README.md": "# template\nv2\n",
                              ".github/template-base": f"# by hand\n{v2}\n"})
        self.f.template_commit({"doc.md": DOC + "line 13\n"}, "v3")
        r, out = self.f.run()
        self.assertIn("(recorded)", r.stdout)
        self.assertIn("compare/" + v2, self.f.body())
        self.assertEqual(self.f.staged().split(), ["M", ".github/template-base", "M", "doc.md"])

    def test_without_a_base_nothing_is_removed_and_replacements_are_listed(self):
        # A client whose first commit is not a template commit: a hand copy, edited.
        write(self.f.client, {"README.md": "# ours\n"})
        git("commit", "-q", "-a", "--amend", "-m", "hand copy", cwd=self.f.client)
        self.f.template_commit({"old.txt": None, "new.txt": "added\n"}, "v2")
        r, out = self.f.run()
        self.assertEqual(out["changed"], "true", r.stderr)
        self.assertIn("unknown", r.stdout)
        self.assertEqual(out["attention"], "2", "each no-base replacement needs a look")
        self.assertTrue((self.f.client / "old.txt").exists())
        self.assertEqual(self.f.read("README.md"), "# template\nv1\n")
        listed = self.f.body().split("replaced without a base")[1]
        self.assertIn("`README.md`", listed)
        self.assertIn("`new.txt`", listed)

    def test_a_damaged_base_file_stops_the_run(self):
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        self.f.client_commit({".github/template-base": "# by hand\nnot-a-commit\n"})
        r, _ = self.f.run()
        self.assertEqual(r.returncode, 2)
        self.assertIn("not a commit id", r.stderr)
        self.assertEqual(self.f.staged(), "")

    def test_a_base_file_with_no_commit_line_stops_the_run(self):
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        self.f.client_commit({".github/template-base": "# only a comment\n"})
        r, _ = self.f.run()
        self.assertEqual(r.returncode, 2)
        self.assertIn("not a commit id", r.stderr)
        self.assertEqual(self.f.read("README.md"), "# template\nv1\n")

    def test_a_base_that_cannot_be_fetched_stops_the_run_rather_than_overwrite(self):
        self.f.client_commit({".github/workflows/ci.yml": "name: ours\n",
                              ".github/template-base": "0123456789abcdef0123456789abcdef01234567\n"})
        self.f.template_commit({".github/workflows/ci.yml": "name: ci v2\n"}, "v2")
        r, _ = self.f.run()
        self.assertEqual(r.returncode, 2)
        self.assertIn("could not be fetched", r.stderr)
        self.assertEqual(self.f.read(".github/workflows/ci.yml"), "name: ours\n")
        self.assertEqual(self.f.staged(), "")

    def test_an_untracked_file_where_the_template_adds_one_is_refused(self):
        self.f.template_commit({"new.txt": "from the template\n"}, "v2")
        (self.f.client / "new.txt").write_text("my notes, not committed\n")
        r, _ = self.f.run()
        self.assertEqual(r.returncode, 2)
        self.assertIn("new.txt", r.stderr)
        self.assertEqual(self.f.read("new.txt"), "my notes, not committed\n")

    def test_the_template_itself_does_nothing(self):
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        r, out = self.f.run(env={**ENV, "GITHUB_REPOSITORY": "Example/Site-Template"})
        self.assertEqual(out["changed"], "false", r.stderr)
        self.assertIn("this is the template itself", r.stdout)
        self.assertEqual(self.f.staged(), "")

    def test_a_dirty_checkout_is_refused(self):
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        (self.f.client / "doc.md").write_text("uncommitted\n")
        r, _ = self.f.run()
        self.assertEqual(r.returncode, 2)
        self.assertIn("uncommitted changes", r.stderr)

    def test_dry_run_changes_nothing(self):
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        r, out = self.f.run("--dry-run")
        self.assertEqual(out["changed"], "true", r.stderr)
        self.assertEqual(self.f.staged(), "")
        self.assertEqual(self.f.read("README.md"), "# template\nv1\n")

    def test_the_executable_bit_comes_with_the_file(self):
        self.f.template_commit({"scripts/tool.sh": "#!/bin/sh\necho v2\n"}, "v2")
        self.f.run()
        mode = git("ls-files", "-s", "scripts/tool.sh", cwd=self.f.client).split()[0]
        self.assertEqual(mode, "100755")
        self.assertTrue(os.access(self.f.client / "scripts/tool.sh", os.X_OK))


def step_script(name: str) -> str:
    """The `run: |` block of one step of the shipped workflow, without a YAML library."""
    lines = WORKFLOW.read_text().splitlines()
    start = next(i for i, l in enumerate(lines) if l.strip() == f"- name: {name}")
    run = next(i for i in range(start, len(lines)) if lines[i].strip() == "run: |")
    indent = len(lines[run]) - len(lines[run].lstrip()) + 2
    body = []
    for line in lines[run + 1:]:
        if line.strip() and len(line) - len(line.lstrip()) < indent:
            break
        body.append(line[indent:])
    return "\n".join(body) + "\n"


GH_STUB = """#!/bin/sh
# Stand-in for the GitHub CLI: records what the step asks for.
case "$1 $2" in
  "auth setup-git") exit 0 ;;
  "pr list") cat "$STUB_DIR/prior" 2>/dev/null; exit 0 ;;
  "pr create") echo "$@" >> "$STUB_DIR/created"; exit 0 ;;
esac
echo "gh stub: unexpected $*" >&2; exit 1
"""


class ThePushStep(unittest.TestCase):
    """`Open the pull request with your token`, run under bash as the workflow runs it,
    against a local bare repository standing in for GitHub and a stub `gh`."""

    REPO = "client-org/client-site"

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        tmp = Path(self._tmp.name)
        self.f = Fixture(tmp)
        self.origin = tmp / "origin.git"
        git("init", "-q", "--bare", "-b", "main", str(self.origin), cwd=tmp)
        self.stub = tmp / "stub"
        (self.stub / "bin").mkdir(parents=True)
        (self.stub / "bin" / "gh").write_text(GH_STUB)
        os.chmod(self.stub / "bin" / "gh", 0o755)
        self.step = step_script("Open the pull request with your token")
        self.f.template_commit({"README.md": "# template\nv2\n"}, "v2")
        r, self.out = self.f.run()
        self.assertEqual(self.out["changed"], "true", r.stderr)

    def tearDown(self):
        self._tmp.cleanup()

    def run_step(self, remote=None):
        env = {**ENV, "GH_TOKEN": "x", "SOURCE": self.out["source"], "SHORT": self.out["short"],
               "ATTENTION": self.out["attention"], "RUNNER_TEMP": str(self.f.tmp),
               "GITHUB_REPOSITORY": self.REPO, "STUB_DIR": str(self.stub),
               "PATH": f"{self.stub / 'bin'}:{os.environ['PATH']}",
               "GIT_CONFIG_COUNT": "1",
               "GIT_CONFIG_KEY_0": f"url.file://{remote or self.origin}.insteadOf",
               "GIT_CONFIG_VALUE_0": f"https://github.com/{self.REPO}.git"}
        return subprocess.run(["bash", "-e", "-c", self.step], cwd=self.f.client, env=env,
                              capture_output=True, text=True)

    @property
    def branch(self):
        return f"template-update/{self.out['short']}"

    def created(self):
        p = self.stub / "created"
        return p.read_text() if p.exists() else ""

    def remote_readme(self):
        return git("show", f"{self.branch}:README.md", cwd=self.origin)

    def push_branch(self, readme: str):
        """A branch an earlier run (or a person) left on the remote."""
        other = self.f.tmp / "other"
        git("clone", "-q", str(self.f.client), str(other), cwd=self.f.tmp)
        write(other, {"README.md": readme})
        git("commit", "-q", "-am", "earlier", cwd=other)
        git("push", "-q", str(self.origin), f"HEAD:refs/heads/{self.branch}", cwd=other)

    def test_a_new_update_is_pushed_and_opened(self):
        r = self.run_step()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.remote_readme(), "# template\nv2")
        self.assertIn(f"--head {self.branch}", self.created())
        self.assertNotIn("--draft", self.created())

    def test_an_update_that_needs_you_opens_as_a_draft(self):
        self.out["attention"] = "2"
        r = self.run_step()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("--draft", self.created())
        self.assertIn("2 file(s) need you", self.created())

    def test_a_declined_update_is_left_alone(self):
        self.push_branch("# what the client pushed while resolving\n")
        (self.stub / "prior").write_text("7\n")
        r = self.run_step()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("closed without merging", r.stdout)
        self.assertEqual(self.created(), "")
        self.assertEqual(self.remote_readme(), "# what the client pushed while resolving")

    def test_a_half_finished_run_is_replaced_by_this_runs_update(self):
        self.push_branch("# a stale snapshot from an earlier run\n")
        r = self.run_step()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("stopped before opening its pull request", r.stdout)
        self.assertEqual(self.remote_readme(), "# template\nv2")
        self.assertIn(f"--head {self.branch}", self.created())

    def test_an_unreadable_remote_stops_the_run(self):
        r = self.run_step(remote=self.f.tmp / "no-such-repo.git")
        self.assertEqual(r.returncode, 1)
        self.assertIn("Could not read this repository's branches", r.stdout)
        self.assertEqual(self.created(), "")


class WhatShips(unittest.TestCase):
    """The script, the config and the workflow as this template ships them."""

    # sha256 of lentago/uvularia's templates/*/scripts/template-update.py at commit
    # 5189e456e48be2feba91c4fbe32b9b185cfe59f3 (blob 5eca640). This kit carries a
    # byte-for-byte copy. To take a later version, copy uvularia's file over it, and
    # move this hash and the commit in the workflow's header together.
    UVULARIA_SHA256 = "4035b3bbf6ef93d05fe19bb661cf811efed40bf6f8d4da242ac10dd7649483e6"

    def test_the_script_is_still_uvularias_copy(self):
        digest = hashlib.sha256(SCRIPT.read_bytes()).hexdigest()
        self.assertEqual(digest, self.UVULARIA_SHA256,
                         "scripts/template-update.py has drifted from uvularia's copy; make "
                         "the change in lentago/uvularia and copy the file back here")
        self.assertTrue(os.access(SCRIPT, os.X_OK))

    def test_the_config_names_this_template_and_keeps_what_is_the_clients(self):
        cfg = tomllib.loads((ROOT / ".github/template-update.toml").read_text())
        self.assertEqual(cfg["source"], "lentago/monarda")
        self.assertEqual(cfg.get("branch"), "main")
        self.assertLessEqual({"content/", ".github/CODEOWNERS", "LICENSE"}, set(cfg["keep"]))
        self.assertNotIn("campaign.config.ts", cfg["keep"],
                         "the config is merged, so a new kit setting arrives (ADR-0005)")
        for k in cfg["keep"]:
            self.assertTrue((ROOT / k.rstrip("/")).exists(),
                            f"keep entry {k!r} names nothing in the template")

    def test_the_workflow_is_pinned_and_keeps_the_token_where_it_belongs(self):
        wf = WORKFLOW.read_text()
        for line in re.findall(r"uses:\s*(\S+)", wf):
            self.assertRegex(line, r"@[0-9a-f]{40}$", "every action is pinned to a commit")
            self.assertFalse(line.startswith("lentago/"), "no workflow from another repository")
        self.assertIn("persist-credentials: false", wf)
        perms = re.search(r"^permissions:\n((?:  .*\n)+)", wf, re.M).group(1)
        grants = dict(re.findall(r"^  ([a-z-]+): (\w+)", perms, re.M))
        self.assertEqual(grants, {"contents": "read", "pull-requests": "read",
                                  "issues": "write"})
        uses = re.findall(r"secrets\.TEMPLATE_UPDATE_TOKEN([^}]*)}}", wf)
        self.assertEqual(len(uses), 2, "the token is named twice: whether it is set, and the "
                                       "one step that pushes and opens the pull request")
        steps = re.split(r"\n      - ", wf)
        holders = [s.splitlines()[0] for s in steps if "secrets.TEMPLATE_UPDATE_TOKEN }}" in s]
        self.assertEqual(holders, ["name: Open the pull request with your token"])
        push = next(s for s in steps if s.startswith("name: Open the pull request"))
        self.assertNotRegex(push, r"--force(?!-with-lease=)", "never a bare force-push: a "
                            "closed update's branch may hold your work (ThePushStep runs it)")
        self.assertNotRegex(push, r"https://[^\s\"]*@github\.com", "no token in a URL")
        self.assertIn("steps.update.outputs.attention", push)
        self.assertIn("git ls-remote --exit-code", push, "tell a missing branch from an error")
        self.assertNotIn("2>/dev/null", push, "no error is swallowed as 'branch does not exist'")
        self.assertIn("--state all", push, "a branch with no pull request is a half-finished run")


if __name__ == "__main__":
    unittest.main()
