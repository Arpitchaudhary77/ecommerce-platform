import {
  Check,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
} from '../api';

import {
  useAuth,
} from '../context/AuthContext';

const emptyAddress = {
  label: 'Home',
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: true,
};

export default function Account() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
    saveProfile,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] = useState({
    firstName:
      user?.firstName || '',
    lastName:
      user?.lastName || '',
    phone:
      user?.phone || '',
  });

  const [
    addresses,
    setAddresses,
  ] = useState([]);

  const [
    loadingAddresses,
    setLoadingAddresses,
  ] = useState(true);

  const [
    showAddressForm,
    setShowAddressForm,
  ] = useState(false);

  const [
    address,
    setAddress,
  ] = useState(
    emptyAddress
  );

  const [
    profileMessage,
    setProfileMessage,
  ] = useState('');

  const [
    addressError,
    setAddressError,
  ] = useState('');

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);

  const [
    savingAddress,
    setSavingAddress,
  ] = useState(false);

  useEffect(() => {
    async function loadAddresses() {
      try {
        const response =
          await getAddresses();

        setAddresses(
          response.data
        );
      } catch {
        setAddresses([]);
      } finally {
        setLoadingAddresses(
          false
        );
      }
    }

    loadAddresses();
  }, []);

  function updateProfileField(
    field,
    value
  ) {
    setProfile(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  function updateAddressField(
    field,
    value
  ) {
    setAddress(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function handleProfileSave(
    event
  ) {
    event.preventDefault();

    setProfileMessage('');
    setSavingProfile(
      true
    );

    try {
      await saveProfile(
        profile
      );

      setProfileMessage(
        'Profile updated successfully.'
      );
    } catch (error) {
      setProfileMessage(
        error.message
      );
    } finally {
      setSavingProfile(
        false
      );
    }
  }

  async function handleAddressSave(
    event
  ) {
    event.preventDefault();

    setAddressError('');
    setSavingAddress(
      true
    );

    try {
      const response =
        await createAddress(
          address
        );

      setAddresses(
        (current) => [
          response.data,
          ...current.filter(
            (item) =>
              !(
                address.isDefault &&
                item.isDefault
              )
          ),
        ]
      );

      setAddress(
        emptyAddress
      );

      setShowAddressForm(
        false
      );
    } catch (error) {
      setAddressError(
        error.message
      );
    } finally {
      setSavingAddress(
        false
      );
    }
  }

  async function makeDefault(
    id
  ) {
    try {
      await setDefaultAddress(
        id
      );

      const response =
        await getAddresses();

      setAddresses(
        response.data
      );
    } catch {
      // UI stays unchanged on failed refresh.
    }
  }

  async function removeAddress(
    id
  ) {
    if (
      !window.confirm(
        'Delete this address?'
      )
    ) {
      return;
    }

    try {
      await deleteAddress(
        id
      );

      setAddresses(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

      const response =
        await getAddresses();

      setAddresses(
        response.data
      );
    } catch {
      // Leave UI unchanged on failure.
    }
  }

  async function handleLogout() {
    await logout();

    navigate(
      '/',
      { replace: true }
    );
  }

  return (
    <main className="container account-page">
      <div className="account-heading">
        <div>
          <span className="eyebrow">
            MY ACCOUNT
          </span>

          <h1>
            Hello, {user.firstName}.
          </h1>

          <p>
            Manage your personal
            details and delivery
            addresses.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={
            handleLogout
          }
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>

      <div className="account-grid">
        <section className="account-card">
          <div className="account-card-heading">
            <div>
              <span className="eyebrow">
                PERSONAL DETAILS
              </span>

              <h2>
                Your profile
              </h2>
            </div>

            <Pencil size={18} />
          </div>

          <form
            className="account-form"
            onSubmit={
              handleProfileSave
            }
          >
            <div className="form-two-column">
              <label>
                First name
                <input
                  required
                  value={
                    profile.firstName
                  }
                  onChange={(
                    event
                  ) =>
                    updateProfileField(
                      'firstName',
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <label>
                Last name
                <input
                  value={
                    profile.lastName
                  }
                  onChange={(
                    event
                  ) =>
                    updateProfileField(
                      'lastName',
                      event.target
                        .value
                    )
                  }
                />
              </label>
            </div>

            <label>
              Email
              <input
                value={
                  user.email
                }
                disabled
              />
            </label>

            <label>
              Phone
              <input
                value={
                  profile.phone
                }
                onChange={(
                  event
                ) =>
                  updateProfileField(
                    'phone',
                    event.target
                      .value
                  )
                }
              />
            </label>

            {profileMessage && (
              <div className="form-success">
                {profileMessage}
              </div>
            )}

            <button
              className="primary-button compact"
              disabled={
                savingProfile
              }
            >
              {savingProfile
                ? 'Saving...'
                : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="account-card">
          <div className="account-card-heading">
            <div>
              <span className="eyebrow">
                DELIVERY
              </span>

              <h2>
                Your addresses
              </h2>
            </div>

            <button
              className="secondary-icon-button"
              onClick={() =>
                setShowAddressForm(
                  (value) => !value
                )
              }
              aria-label="Add address"
            >
              <Plus size={19} />
            </button>
          </div>

          {showAddressForm && (
            <form
              className="address-form"
              onSubmit={
                handleAddressSave
              }
            >
              {addressError && (
                <div className="form-error">
                  {addressError}
                </div>
              )}

              <div className="form-two-column">
                <label>
                  Label
                  <input
                    required
                    value={
                      address.label
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'label',
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  Phone
                  <input
                    required
                    value={
                      address.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'phone',
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </div>

              <div className="form-two-column">
                <label>
                  First name
                  <input
                    required
                    value={
                      address.firstName
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'firstName',
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  Last name
                  <input
                    value={
                      address.lastName
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'lastName',
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Address line 1
                <input
                  required
                  value={
                    address.addressLine1
                  }
                  onChange={(
                    event
                  ) =>
                    updateAddressField(
                      'addressLine1',
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <label>
                Address line 2
                <input
                  value={
                    address.addressLine2
                  }
                  onChange={(
                    event
                  ) =>
                    updateAddressField(
                      'addressLine2',
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <div className="form-three-column">
                <label>
                  City
                  <input
                    required
                    value={
                      address.city
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'city',
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  State
                  <input
                    required
                    value={
                      address.state
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'state',
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  PIN code
                  <input
                    required
                    value={
                      address.postalCode
                    }
                    onChange={(
                      event
                    ) =>
                      updateAddressField(
                        'postalCode',
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={
                    address.isDefault
                  }
                  onChange={(
                    event
                  ) =>
                    updateAddressField(
                      'isDefault',
                      event.target
                        .checked
                    )
                  }
                />

                Make default address
              </label>

              <div className="address-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAddressForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button compact"
                  disabled={
                    savingAddress
                  }
                >
                  {savingAddress
                    ? 'Saving...'
                    : 'Save address'}
                </button>
              </div>
            </form>
          )}

          {loadingAddresses && (
            <div className="account-empty">
              Loading addresses...
            </div>
          )}

          {!loadingAddresses &&
            !addresses.length &&
            !showAddressForm && (
              <div className="account-empty">
                <p>
                  No addresses saved yet.
                </p>

                <button
                  className="primary-button compact"
                  onClick={() =>
                    setShowAddressForm(
                      true
                    )
                  }
                >
                  Add your first address
                </button>
              </div>
            )}

          <div className="address-list">
            {addresses.map(
              (item) => (
                <article
                  className="address-item"
                  key={item.id}
                >
                  <div className="address-item-top">
                    <div>
                      <strong>
                        {item.label}
                      </strong>

                      {item.isDefault && (
                        <span className="default-badge">
                          <Check
                            size={12}
                          />
                          Default
                        </span>
                      )}
                    </div>

                    <button
                      className="remove-button"
                      onClick={() =>
                        removeAddress(
                          item.id
                        )
                      }
                    >
                      <Trash2
                        size={15}
                      />
                      Delete
                    </button>
                  </div>

                  <p>
                    {item.firstName}{' '}
                    {item.lastName}
                    <br />
                    {item.addressLine1}
                    {item.addressLine2 && (
                      <>
                        <br />
                        {item.addressLine2}
                      </>
                    )}
                    <br />
                    {item.city},{' '}
                    {item.state}{' '}
                    {item.postalCode}
                    <br />
                    {item.phone}
                  </p>

                  {!item.isDefault && (
                    <button
                      className="text-link"
                      onClick={() =>
                        makeDefault(
                          item.id
                        )
                      }
                    >
                      Make default
                    </button>
                  )}
                </article>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
