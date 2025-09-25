
export const fetchObjects = async (type) => {
  const res = await fetch(`http://localhost:5000/api/${type}`);
  return await res.json();
};
