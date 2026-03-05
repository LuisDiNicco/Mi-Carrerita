import { useHistoryTable } from '../hooks/useHistoryTable';
import { HistoryEditor } from './HistoryEditor';
import { HistoryToolbar } from './HistoryToolbar';
import { HistoryGrid } from './HistoryGrid';
import { PdfPreviewModal } from './PdfPreviewModal';

export const HistoryTable = () => {
  const tableProps = useHistoryTable();

  const {
    subjects,
    editingId,
    subjectId, setSubjectId,
    status, setStatus,
    grade, setGrade,
    difficulty, setDifficulty,
    statusDate, setStatusDate,
    notes, setNotes,
    isSaving,
    error,
    isCalendarOpen, setIsCalendarOpen,
    fileInputRef,
    isUploading,
    parsedRecords, setParsedRecords,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    sortConfig,
    pendingDelete, setPendingDelete,
    deleteError, setDeleteError,
    filteredAndSortedRows,
    handleSort,
    resetForm,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleSave,
    handleFileSelect,
    handleBatchConfirm,
  } = tableProps;

  return (
    <div className="space-y-6 pb-20">
      <HistoryEditor
        subjects={subjects}
        editingId={editingId}
        subjectId={subjectId} setSubjectId={setSubjectId}
        status={status} setStatus={setStatus}
        grade={grade} setGrade={setGrade}
        difficulty={difficulty} setDifficulty={setDifficulty}
        statusDate={statusDate} setStatusDate={setStatusDate}
        notes={notes} setNotes={setNotes}
        isSaving={isSaving}
        error={error}
        isCalendarOpen={isCalendarOpen} setIsCalendarOpen={setIsCalendarOpen}
        handleSave={handleSave}
        resetForm={resetForm}
      />

      <HistoryToolbar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        fileInputRef={fileInputRef}
        isUploading={isUploading}
        handleFileSelect={handleFileSelect}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
      />

      <HistoryGrid
        rows={filteredAndSortedRows}
        sortConfig={sortConfig}
        handleSort={handleSort}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        pendingDelete={pendingDelete}
        confirmDelete={confirmDelete}
        setPendingDelete={setPendingDelete}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
      />

      {/* PDF Preview Modal */}
      {parsedRecords && (
        <PdfPreviewModal
          records={parsedRecords}
          onConfirm={handleBatchConfirm}
          onClose={() => setParsedRecords(null)}
        />
      )}
    </div>
  );
};

