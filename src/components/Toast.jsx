export default function Toast({ message, isError, visible }) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-opacity ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${isError ? "bg-red-700" : "bg-slate-900"}`}
    >
      <span>{message}</span>
    </div>
  );
}
