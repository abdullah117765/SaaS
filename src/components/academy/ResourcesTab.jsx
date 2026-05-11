import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaDownload,
  FaTrash,
  FaEdit,
  FaPlus,
  FaSyncAlt,
  FaFileAlt,
  FaFilePdf,
  FaFileVideo,
  FaFileImage,
  FaFileArchive,
  FaFileCode,
  FaFile,
} from "react-icons/fa";

const DEFAULT_FORM = {
  title: "",
  type: "document",
  classId: "all",
  description: "",
  visibility: "ACADEMY",
};

const fileIcon = (type) => {
  switch ((type ?? "").toLowerCase()) {
    case "pdf":
      return <FaFilePdf className="text-red-500" />;
    case "video":
      return <FaFileVideo className="text-blue-500" />;
    case "image":
      return <FaFileImage className="text-green-500" />;
    case "archive":
      return <FaFileArchive className="text-purple-500" />;
    case "code":
      return <FaFileCode className="text-gray-500" />;
    case "document":
      return <FaFileAlt className="text-yellow-500" />;
    default:
      return <FaFile className="text-gray-400" />;
  }
};

const formatFileSize = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return "--";
  }
  const base = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(base)));
  const value = size / Math.pow(base, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const inferTypeFromFile = (file) => {
  const mimeType = file?.type?.toLowerCase?.() ?? "";
  const name = file?.name?.toLowerCase?.() ?? "";
  if (mimeType.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.includes("zip") || /\.(zip|rar|7z)$/i.test(name)) return "archive";
  if (mimeType.includes("json") || /\.(js|ts|tsx|jsx|py|java|cs|html|css)$/i.test(name)) return "code";
  return "document";
};

const ResourcesTab = ({
  resources = [],
  classes = [],
  loading = false,
  onUploadResource,
  onUpdateResource,
  onDeleteResource,
  onRefreshResources,
  canManage = true,
  audience = "academy",
}) => {
  const canCreate = canManage && typeof onUploadResource === "function";
  const canModify = canManage && typeof onUpdateResource === "function";
  const canRemove = canManage && typeof onDeleteResource === "function";
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ type: "all", class: "all", uploader: "all" });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(resources.map((item) => item.type ?? "other"))),
    [resources],
  );

  const uniqueClasses = useMemo(
    () =>
      Array.from(
        new Set(
          resources.map((item) => {
            if (item.class && item.class !== "") {
              return item.class;
            }
            return "General";
          }),
        ),
      ),
    [resources],
  );

  const uniqueUploaders = useMemo(
    () => Array.from(new Set(resources.map((item) => item.uploader ?? "Unknown"))),
    [resources],
  );

  const visibilityOptions = useMemo(() => {
    if (audience === "teacher") {
      return [
        {
          value: "PRIVATE",
          label: "Selected class only",
          helper: "Students enrolled in the linked class can access it.",
          requiresClass: true,
        },
        {
          value: "ACADEMY",
          label: "Academy members",
          helper: "Approved teachers and students in this academy can access it.",
        },
      ];
    }

    return [
      {
        value: "ACADEMY",
        label: "Academy members",
        helper: "Approved teachers and students in this academy can access it.",
      },
      {
        value: "PRIVATE",
        label: "Academy admins only",
        helper: "Only academy admins and the uploader can access it.",
      },
    ];
  }, [audience]);

  const selectedVisibility = visibilityOptions.find(
    (option) => option.value === formValues.visibility,
  );

  const filteredResources = useMemo(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        loweredSearch.length === 0 ||
        resource.title.toLowerCase().includes(loweredSearch) ||
        (resource.description ?? "").toLowerCase().includes(loweredSearch) ||
        (resource.class ?? "").toLowerCase().includes(loweredSearch) ||
        (resource.uploader ?? "").toLowerCase().includes(loweredSearch);

      const matchesType = filters.type === "all" || (resource.type ?? "other") === filters.type;
      const matchesClass =
        filters.class === "all" ||
        (resource.class ?? "General") === filters.class ||
        (filters.class === "General" && !resource.class);
      const matchesUploader =
        filters.uploader === "all" || (resource.uploader ?? "Unknown") === filters.uploader;

      return matchesSearch && matchesType && matchesClass && matchesUploader;
    });
  }, [resources, searchTerm, filters]);

  const totalSize = useMemo(
    () => filteredResources.reduce((sum, resource) => sum + (resource.size ?? 0), 0),
    [filteredResources],
  );

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      return;
    }
    setEditingResource(null);
    setFormValues(DEFAULT_FORM);
    setSelectedFile(null);
    setModalError(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (resource) => {
    if (!canModify) {
      return;
    }
    setEditingResource(resource);
    setFormValues({
      title: resource.title ?? "",
      type: resource.type ?? "document",
      classId: resource.classId ?? "all",
      description: resource.description ?? "",
      visibility:
        visibilityOptions.some((option) => option.value === resource.visibility)
          ? resource.visibility
          : "ACADEMY",
    });
    setSelectedFile(null);
    setModalError(null);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setModalError(null);
    setSubmitting(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "classId" && value === "all" && prev.visibility === "PRIVATE"
        ? { visibility: "ACADEMY" }
        : {}),
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (!file) return;

    setFormValues((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      type: inferTypeFromFile(file),
    }));
  };

  const buildPayload = () => {
    const classId = formValues.classId === "all" ? "" : formValues.classId;
    const visibility =
      formValues.visibility === "PRIVATE" && formValues.classId === "all"
        ? "ACADEMY"
        : formValues.visibility;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", formValues.title.trim());
      formData.append("fileType", formValues.type);
      formData.append("visibility", visibility);
      if (formValues.description?.trim()) {
        formData.append("description", formValues.description.trim());
      }
      if (classId) {
        formData.append("classId", classId);
      }
      return formData;
    }

    return {
      title: formValues.title.trim(),
      description: formValues.description?.trim() || undefined,
      fileType: formValues.type,
      classId: classId || null,
      visibility,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canCreate && !canModify) {
      return;
    }

    setSubmitting(true);
    setModalError(null);
    setActionError(null);

    try {
      if (!editingResource && !selectedFile) {
        setModalError("Choose a file from your computer before uploading.");
        return;
      }
      const payload = buildPayload();
      let result;

      if (editingResource && canModify) {
        result = await onUpdateResource(editingResource.id, payload);
      } else if (canCreate) {
        result = await onUploadResource(payload);
      }

      if (result && result.success === false) {
        setModalError(result.error ?? "Unable to save resource.");
        return;
      }

      setFeedback(editingResource ? "Resource updated successfully." : "Resource uploaded successfully.");
      setShowFormModal(false);
      setEditingResource(null);
      setFormValues(DEFAULT_FORM);
      setSelectedFile(null);

      if (typeof onRefreshResources === "function") {
        await onRefreshResources();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save resource.";
      setModalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!canRemove) {
      return;
    }

    setActionError(null);
    setActionLoadingId(resourceId);

    try {
      const result = await onDeleteResource(resourceId);
      if (result && result.success === false) {
        setActionError(result.error ?? "Unable to delete resource.");
        return;
      }

      setFeedback("Resource deleted successfully.");
      if (typeof onRefreshResources === "function") {
        await onRefreshResources();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete resource.";
      setActionError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownload = (resource) => {
    if (!resource?.downloadUrl) {
      return;
    }
    window.open(resource.downloadUrl, "_blank", "noopener");
  };

  const renderModal = () => {
    if (!showFormModal) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
        <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingResource ? "Update Resource" : "Upload New Resource"}
            </h3>
            <p className="text-sm text-gray-500">
              Choose a file and define who should be able to access it.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-6 py-4">
              {modalError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formValues.title}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Resource title"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="resource-file" className="block text-sm font-medium text-gray-700">
                    File {editingResource ? "(optional replacement)" : ""}
                  </label>
                  <input
                    id="resource-file"
                    name="file"
                    type="file"
                    required={!editingResource}
                    onChange={handleFileChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {selectedFile ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedFile.name} - {formatFileSize(selectedFile.size)}
                    </p>
                  ) : editingResource ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Current file remains unchanged unless you choose a replacement.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formValues.type}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="document">Document</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="archive">Archive</option>
                    <option value="code">Code</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
                    Linked Class
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    value={formValues.classId}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">General academy resource</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                    Share with
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={formValues.visibility}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {visibilityOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.requiresClass && formValues.classId === "all"}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedVisibility?.helper ? (
                    <p className="mt-1 text-xs text-gray-500">{selectedVisibility.helper}</p>
                  ) : null}
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formValues.description}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief description of the resource"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : editingResource ? "Update Resource" : "Upload Resource"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Resources Library</h3>
            <p className="text-sm text-gray-500">
              {canManage
                ? "Upload, curate, and distribute materials across your academy."
                : "Browse the materials your teachers have shared."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canCreate ? (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FaPlus className="mr-2" /> Upload Resource
              </button>
            ) : null}
            {typeof onRefreshResources === "function" ? (
              <button
                type="button"
                onClick={onRefreshResources}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FaSyncAlt className="mr-2" /> Refresh
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total resources available</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{resources.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Combined file size</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatFileSize(totalSize)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Distinct classes</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{uniqueClasses.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Contributors</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{uniqueUploaders.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-72">
            <FaSearch className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.type}
              onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.class}
              onChange={(event) => setFilters((prev) => ({ ...prev, class: event.target.value }))}
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.uploader}
              onChange={(event) => setFilters((prev) => ({ ...prev, uploader: event.target.value }))}
            >
              <option value="all">All Uploaders</option>
              {uniqueUploaders.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canManage && feedback && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {feedback}
          </div>
        )}
        {canManage && actionError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-10 text-sm text-gray-500">
              Loading resources...
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-10 text-sm text-gray-500">
              No resources match the current filters.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        {fileIcon(resource.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{resource.title}</h4>
                        <p className="text-xs text-gray-500">
                          {(resource.class ?? "General")} • {resource.uploader ?? "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs uppercase text-gray-600">
                      {resource.visibility ?? "ACADEMY"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                    {resource.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(resource.size)}</span>
                    <span>
                      {resource.uploadDate
                        ? new Date(resource.uploadDate).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(resource)}
                        className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600"
                      >
                        <FaDownload className="mr-1" /> Download
                      </button>
                      {canModify ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(resource)}
                          className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600"
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                      ) : null}
                    </div>
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(resource.id)}
                        disabled={actionLoadingId === resource.id}
                        className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FaTrash className="mr-1" /> {actionLoadingId === resource.id ? "Removing..." : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {renderModal()}
    </motion.div>
  );
};

export default ResourcesTab;

