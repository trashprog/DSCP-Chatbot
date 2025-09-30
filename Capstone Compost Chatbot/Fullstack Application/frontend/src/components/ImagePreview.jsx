export const ImagePreview = (props) => {
  const { imageUrl, onDelete } = props;
  return (
    <div className="relative w-23 h-23 self-start">
      <img
        src={imageUrl}
        alt="Preview"
        className="w-full h-full object-cover rounded-md border border-gray-300"
      />
      <button
        onClick={onDelete}
        className="absolute top-[-8px] right-[-8px] bg-white text-red-500 border border-gray-300 rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center shadow hover:bg-red-500 hover:text-white transition"
        title="Remove image"
      >
        ✖
      </button>
    </div>
  );
};

export default ImagePreview;
