import React from 'react';
import { useDispatch } from 'react-redux';
import closeicon from "../../images/closeicon.png";
import './modalstyle.css';
import { DELETE_CATEGORY } from '../../../store/category/categoryActionType';
import { toast } from 'react-toastify';

const RemoveCategory = ({ closeModal, confirmRemove, categoryId }) => {
  const dispatch = useDispatch();

  const deleteCategory = async (id) => {
    try {
      await dispatch({ type: DELETE_CATEGORY, payload: id });
      confirmRemove();
    } catch (error) {
      toast.error("Error deleting category:", error);
    }
  };

  return (
    <div className="admin-modal show">
      <div className="remove-modal-content">
        <img src={closeicon} alt="Close" className='remove-img' onClick={closeModal} />
        <p>Are you sure you want to remove this category?</p>
        <div className="modal-bottom-btn">
          <button className='modal-btn' onClick={() => deleteCategory(categoryId)}>Delete</button>
          <button className='modal-btn' onClick={closeModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default RemoveCategory;
