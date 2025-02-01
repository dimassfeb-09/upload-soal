interface SelectMenuProps {
  selectedMenu: string;
  setSelectedMenu: (select: string) => void;
}

export default function SelectMenu({
  selectedMenu,
  setSelectedMenu,
}: SelectMenuProps) {
  return (
    <div className="flex justify-around border border-blue-500">
      {[
        { id: "soal", label: "Upload Soal" },
        { id: "ask_ai", label: "Tanya AI" },
      ].map(({ id, label }) => (
        <div
          key={id}
          className={`w-1/2 text-center py-2 cursor-pointer border-l border-r first:border-l-0 last:border-r-0 ${
            selectedMenu === id ? "bg-blue-700 text-white" : ""
          } hover:bg-blue-700 hover:text-white`}
          onClick={() => setSelectedMenu(id)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
