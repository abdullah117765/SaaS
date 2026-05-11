import React from "react";
import ResourcesTab from "../academy/ResourcesTab";

const TeacherResourcesTab = ({
  resources,
  loading,
  error,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  classes,
  hasAcademyAccess,
  loadingAcademies,
}) => {
  const canManageResources = Boolean(hasAcademyAccess) && !loadingAcademies;

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {!canManageResources && !loadingAcademies ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Join an academy to add and manage resources.
        </div>
      ) : null}
      <ResourcesTab
        resources={resources}
        classes={classes}
        loading={loading || loadingAcademies}
        onUploadResource={onCreate}
        onUpdateResource={onUpdate}
        onDeleteResource={onDelete}
        onRefreshResources={onRefresh}
        canManage={canManageResources}
        audience="teacher"
      />
    </div>
  );
};

export default TeacherResourcesTab;
