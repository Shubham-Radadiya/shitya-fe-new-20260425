import React, { useEffect, useState, useMemo } from 'react';
import './modalstyle.css';
import { useDispatch, useSelector } from 'react-redux';
import { REQUEST_UPDATE_SUBCATEGORY } from '../../../store/subcategory/SubCategoryAction';
import { REQUEST_CATEGORY } from '../../../store/category/categoryActionType';
import { toast } from 'react-toastify';
import { sortCategoriesForAdminDisplay } from '../../../utils/productDisplayOrder';

const UpdateSubCategory = ({ closeModal, subCategory, subCategoryId }) => {
  const dispatch = useDispatch();
  const [subCategoryData, setSubCategoryData] = useState(subCategory || {});
  const categories = useSelector((state) => state.category.categories);
  const sortedCategories = useMemo(
    () => sortCategoriesForAdminDisplay(categories || []),
    [categories]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSubCategoryData({
      ...subCategoryData,
      [name]: value,
    });
  };

  const handleUpdateSubCategory = async () => {
    try {
      const updateData = { name: subCategoryData.name, categoryId: subCategoryData.categoryId };
      await dispatch({ type: REQUEST_UPDATE_SUBCATEGORY, payload: { data: updateData, id: subCategoryId } });
      closeModal();
    } catch (error) {
      toast.error('Error updating subcategory:', error);
    }
  };

  useEffect(() => {
    setSubCategoryData(subCategory || {});
  }, [subCategory]);

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  return (
    <div className="admin-modal show">
      <div className="admin-modal-content">
        <div className='flexbtw'>
          <h3 className='modal-title'>Update Sub-Category</h3>
          <span className="closeicon" onClick={closeModal}>&times;</span>
        </div>
        <div className="modal-form">
          <div className='modal-field'>
            <label className="modal-label">
              Category:
              <select
                className="modal-input"
                id="categoryId"
                name="categoryId"
                value={subCategoryData.categoryId || ''}
                onChange={handleChange}
              >
                <option value="" disabled>
                  Select Category
                </option>
                {sortedCategories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className='modal-label'>
              Sub-Category:
              <input
                id='name'
                type="text"
                name="name"
                className='modal-input'
                value={subCategoryData.name || ''}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className='modal-bottom-btn'>
            <button className="modal-btn" type="button" onClick={handleUpdateSubCategory}>Submit</button>
            <button className="modal-btn" type="button" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateSubCategory;
