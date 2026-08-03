import { useEffect, useState } from "react";
import { FileText, LayoutGrid, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { blogApi, homepageBlocksApi, pagesApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { formatDate, idOf, titleCase } from "../utils/format";
import {
  PageHeader,
  Card,
  Tabs,
  Button,
  Field,
  inputCls,
  Badge,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/ui";

const EMPTY_PAGE = { title: "", content: "", status: "draft" };
const EMPTY_POST = { title: "", category: "", content: "", status: "draft", coverImage: "" };

function statusTone(status) {
  return status === "published" ? "success" : "amber";
}

export default function CMS() {
  const [tab, setTab] = useState("Pages");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [pageForm, setPageForm] = useState(EMPTY_PAGE);
  const [pageModal, setPageModal] = useState(false);
  const [postModal, setPostModal] = useState(null);
  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [blockModal, setBlockModal] = useState(null);
  const [blockForm, setBlockForm] = useState({ order: 0, config: "{}" });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const pagesQuery = useAsync(() => pagesApi.list(), []);
  const blogQuery = useAsync(() => blogApi.list(), []);
  const blocksQuery = useAsync(() => homepageBlocksApi.list(), []);

  const pages = Array.isArray(pagesQuery.data?.data) ? pagesQuery.data.data : [];
  const posts = Array.isArray(blogQuery.data?.data) ? blogQuery.data.data : [];
  const blocks = Array.isArray(blocksQuery.data?.data) ? blocksQuery.data.data : [];
  const selectedPage = pages.find((page) => idOf(page) === selectedPageId) || pages[0];

  useEffect(() => {
    if (selectedPage) {
      setSelectedPageId(idOf(selectedPage));
      setPageForm({
        title: selectedPage.title || "",
        content: selectedPage.content || "",
        status: selectedPage.status || "draft",
      });
    }
  }, [selectedPage]);

  function selectPage(page) {
    setSelectedPageId(idOf(page));
    setPageForm({
      title: page.title || "",
      content: page.content || "",
      status: page.status || "draft",
    });
    setActionError("");
  }

  async function runMutation(action, reload, close) {
    setSaving(true);
    setActionError("");
    try {
      await action();
      await reload();
      close?.();
    } catch (error) {
      setActionError(error?.message || "Could not save this content.");
    } finally {
      setSaving(false);
    }
  }

  function createPage(event) {
    event.preventDefault();
    runMutation(
      () => pagesApi.create(pageForm),
      pagesQuery.reload,
      () => {
        setPageModal(false);
        setPageForm(EMPTY_PAGE);
      }
    );
  }

  function updatePage(event) {
    event.preventDefault();
    if (!selectedPage) return;
    runMutation(() => pagesApi.update(idOf(selectedPage), pageForm), pagesQuery.reload);
  }

  async function removePage(page) {
    if (!window.confirm(`Delete "${page.title}"?`)) return;
    await runMutation(
      () => pagesApi.remove(idOf(page)),
      pagesQuery.reload,
      () => setSelectedPageId("")
    );
  }

  function openPost(post = null) {
    setPostModal(post || "new");
    setPostForm(post ? {
      title: post.title || "",
      category: post.category || "",
      content: post.content || "",
      status: post.status || "draft",
      coverImage: post.coverImage || "",
    } : EMPTY_POST);
    setActionError("");
  }

  function savePost(event) {
    event.preventDefault();
    const action = postModal === "new"
      ? () => blogApi.create(postForm)
      : () => blogApi.update(idOf(postModal), postForm);
    runMutation(action, blogQuery.reload, () => setPostModal(null));
  }

  async function removePost(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    await runMutation(() => blogApi.remove(idOf(post)), blogQuery.reload);
  }

  async function toggleBlock(block) {
    await runMutation(
      () => homepageBlocksApi.update(idOf(block), { active: !block.active }),
      blocksQuery.reload
    );
  }

  function openBlock(block) {
    setBlockModal(block);
    setBlockForm({
      order: Number(block.order) || 0,
      config: JSON.stringify(block.config || {}, null, 2),
    });
    setActionError("");
  }

  function saveBlock(event) {
    event.preventDefault();
    let config;
    try {
      config = JSON.parse(blockForm.config || "{}");
    } catch {
      setActionError("Block config must be valid JSON.");
      return;
    }
    runMutation(
      () => homepageBlocksApi.update(idOf(blockModal), { order: Number(blockForm.order), config }),
      blocksQuery.reload,
      () => setBlockModal(null)
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="CMS"
        description="Manage static pages, blog posts, and homepage content blocks."
      />
      <Tabs tabs={["Pages", "Blog", "Homepage blocks"]} active={tab} onChange={setTab} />
      {actionError && <p className="text-sm text-danger mb-4">{actionError}</p>}

      {tab === "Pages" && (
        pagesQuery.loading ? <LoadingState label="Loading pages…" /> :
        pagesQuery.error ? <ErrorState message={pagesQuery.error} onRetry={pagesQuery.reload} /> :
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-2 h-fit">
            <Button
              size="sm"
              className="w-full justify-center mb-2"
              onClick={() => {
                setPageForm(EMPTY_PAGE);
                setPageModal(true);
                setActionError("");
              }}
            >
              <Plus size={13} /> New page
            </Button>
            {pages.map((page) => (
              <button
                key={idOf(page)}
                onClick={() => selectPage(page)}
                className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-md text-sm ${
                  idOf(selectedPage) === idOf(page)
                    ? "bg-primary-light text-primary-dark font-medium"
                    : "hover:bg-bg text-ink"
                }`}
              >
                <FileText size={14} /> <span className="truncate">{page.title}</span>
              </button>
            ))}
          </Card>
          <Card className="p-5 lg:col-span-2">
            {selectedPage ? (
              <form onSubmit={updatePage}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display font-semibold">{selectedPage.title}</h3>
                    <span className="text-xs text-muted">Updated {formatDate(selectedPage.updatedAt)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePage(selectedPage)}
                    className="p-2 rounded hover:bg-danger-light text-muted hover:text-danger"
                    aria-label="Delete page"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <Field label="Page title">
                  <input className={inputCls} value={pageForm.title} onChange={(event) => setPageForm({ ...pageForm, title: event.target.value })} />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={pageForm.status} onChange={(event) => setPageForm({ ...pageForm, status: event.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </Field>
                <Field label="Content">
                  <textarea className={inputCls} rows={12} value={pageForm.content} onChange={(event) => setPageForm({ ...pageForm, content: event.target.value })} />
                </Field>
                <Button type="submit" disabled={saving || !pageForm.title.trim() || !pageForm.content.trim()}>
                  <Save size={14} /> Save page
                </Button>
              </form>
            ) : (
              <EmptyState icon={FileText} title="No pages yet" description="Create the first static page for the storefront." />
            )}
          </Card>
        </div>
      )}

      {tab === "Blog" && (
        blogQuery.loading ? <LoadingState label="Loading blog posts…" /> :
        blogQuery.error ? <ErrorState message={blogQuery.error} onRetry={blogQuery.reload} /> :
        <Card className="p-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => openPost()}><Plus size={13} /> New post</Button>
          </div>
          {posts.length ? (
            <div className="flex flex-col divide-y divide-border">
              {posts.map((post) => (
                <div key={idOf(post)} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{post.title}</div>
                    <div className="text-xs text-muted">{post.category} · Updated {formatDate(post.updatedAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={statusTone(post.status)}>{titleCase(post.status)}</Badge>
                    <button onClick={() => openPost(post)} className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink" aria-label="Edit post"><Pencil size={14} /></button>
                    <button onClick={() => removePost(post)} className="p-1.5 rounded hover:bg-danger-light text-muted hover:text-danger" aria-label="Delete post"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={FileText} title="No blog posts" description="Create a post to start publishing content." />}
        </Card>
      )}

      {tab === "Homepage blocks" && (
        blocksQuery.loading ? <LoadingState label="Loading homepage blocks…" /> :
        blocksQuery.error ? <ErrorState message={blocksQuery.error} onRetry={blocksQuery.reload} /> :
        <Card className="p-4">
          {blocks.length ? (
            <div className="flex flex-col divide-y divide-border">
              {blocks.map((block) => (
                <div key={idOf(block)} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-primary-light text-primary flex items-center justify-center"><LayoutGrid size={15} /></div>
                    <div>
                      <div className="text-sm font-medium">{titleCase(block.type)}</div>
                      <div className="text-xs text-muted">Order {block.order ?? 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openBlock(block)} className="p-1.5 rounded hover:bg-bg text-muted hover:text-ink" aria-label="Edit block"><Pencil size={14} /></button>
                    {"active" in block && (
                      <button
                        onClick={() => toggleBlock(block)}
                        disabled={saving}
                        className={`w-9 h-5 rounded-full transition-colors relative disabled:opacity-50 ${block.active ? "bg-primary" : "bg-border"}`}
                        aria-label={block.active ? "Disable block" : "Enable block"}
                      >
                        <span className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white transition-transform ${block.active ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={LayoutGrid} title="No homepage blocks" description="Homepage blocks will appear here once configured." />}
        </Card>
      )}

      <Modal open={pageModal} onClose={() => setPageModal(false)} title="New page">
        <form onSubmit={createPage}>
          <Field label="Page title"><input autoFocus className={inputCls} value={pageForm.title} onChange={(event) => setPageForm({ ...pageForm, title: event.target.value })} /></Field>
          <Field label="Status">
            <select className={inputCls} value={pageForm.status} onChange={(event) => setPageForm({ ...pageForm, status: event.target.value })}>
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </Field>
          <Field label="Content"><textarea className={inputCls} rows={8} value={pageForm.content} onChange={(event) => setPageForm({ ...pageForm, content: event.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPageModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !pageForm.title.trim() || !pageForm.content.trim()}>Create page</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!postModal} onClose={() => setPostModal(null)} title={postModal === "new" ? "New blog post" : "Edit blog post"} width="max-w-2xl">
        <form onSubmit={savePost}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Title"><input autoFocus className={inputCls} value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} /></Field>
            <Field label="Category"><input className={inputCls} value={postForm.category} onChange={(event) => setPostForm({ ...postForm, category: event.target.value })} /></Field>
          </div>
          <Field label="Cover image URL"><input type="url" className={inputCls} value={postForm.coverImage} onChange={(event) => setPostForm({ ...postForm, coverImage: event.target.value })} /></Field>
          <Field label="Status">
            <select className={inputCls} value={postForm.status} onChange={(event) => setPostForm({ ...postForm, status: event.target.value })}>
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </Field>
          <Field label="Content"><textarea className={inputCls} rows={10} value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPostModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving || !postForm.title.trim() || !postForm.category.trim() || !postForm.content.trim()}>Save post</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!blockModal} onClose={() => setBlockModal(null)} title={`Edit ${titleCase(blockModal?.type || "block")}`}>
        <form onSubmit={saveBlock}>
          <Field label="Display order"><input type="number" className={inputCls} value={blockForm.order} onChange={(event) => setBlockForm({ ...blockForm, order: event.target.value })} /></Field>
          <Field label="Config (JSON)"><textarea className={`${inputCls} font-mono`} rows={12} value={blockForm.config} onChange={(event) => setBlockForm({ ...blockForm, config: event.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setBlockModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}><Save size={14} /> Save block</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
