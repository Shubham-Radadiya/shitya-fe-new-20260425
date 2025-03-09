import React, { useEffect, useState } from 'react';
import './modalstyle.css';
import { CREATE_SUBCATEGORY_REQUEST } from '../../../store/subcategory/SubCategoryAction';
import { useDispatch, useSelector } from 'react-redux';
import { REQUEST_CATEGORY } from '../../../store/category/categoryActionType';

const SubCategory = ({ closeModal }) => {
  const dispatch = useDispatch();
  const [subCategoryData, setSubCategoryData] = useState({});
  const categories = useSelector((state) => state.category.categories);

  const handleChange = (event) => {
    setSubCategoryData({
      ...subCategoryData,
      [event.target.name]: event.target.value,
    });
  };
  const HandleCreateSubCategory = async () => {
    try {
      await dispatch({ type: CREATE_SUBCATEGORY_REQUEST, payload: subCategoryData });
      closeModal();
    } catch (error) {
      throw error;
    }
  }; 

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  return (
    <>
      <div className="admin-modal show">
        <div className="admin-modal-content">
          <div className='flexbtw'>
            <h3 className='modal-title'>Add Sub-Category</h3>
            <span className="closeicon" onClick={closeModal}>&times;</span>
          </div>
          <div className="modal-form">
            <div className="modal-field">
            <label className="modal-label">
              Category:
              <select
                className="modal-input"
                id="categoryId"
                name="categoryId"
                onChange={handleChange}
              >
                <option value="" disabled selected>
                  Category
                </option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </label>
              <label className='modal-label'>
                Sub-Category:
                <input id='name' type="text" name="name" className='modal-input' onChange={handleChange}/>
              </label>
            </div>
            <div className='modal-bottom-btn'>
              <button className="modal-btn" type="button" onClick={HandleCreateSubCategory}>Submit</button>
              <button className="modal-btn" type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubCategory;
